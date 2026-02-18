#include "HttpRecordSender.h"

#include <chrono>
#include <iostream>
#include <thread>

#include <plog/Log.h> 

using namespace std::chrono_literals;

namespace
{
    constexpr size_t QUEUE_CAPACITY = 1024;
    constexpr int MAX_RETRIES = 5;
    constexpr auto INITIAL_BACKOFF = 100ms;
}

DataLogger::HttpRecordSender::HttpRecordSender(
    const std::string& baseURL,      
    OverflowPolicy policy,
    std::unique_ptr<IAuthentication> authentication
)
    : NetworkLoggerBase(baseURL,std::move(authentication)),
    _queue(std::make_unique<BoundedQueue<Record>>(QUEUE_CAPACITY)),
    _policy(policy)
{    
    _consumer = std::thread(&HttpRecordSender::Transmitter, this);
}

DataLogger::HttpRecordSender::~HttpRecordSender()
{
    _running.store(false, std::memory_order_release);
    _queue->shutdown();

    if (_consumer.joinable())
        _consumer.join();
}

bool DataLogger::HttpRecordSender::Submit(const Record& record) noexcept
{
    bool result = false;
    if (RunId() < 0 || !_running.load(std::memory_order_relaxed))
        return result;

    try
    {
        if (_policy == OverflowPolicy::Drop)
        {
            result = _queue->try_emplace(record);
        }
        else
        {
            _queue->emplace(record);
            result = true;
        }

        if (result)
            _pending.fetch_add(1, std::memory_order_relaxed);
    }
    catch (...)
    {
        result = false;
    }

    return result;
}

void DataLogger::HttpRecordSender::Flush(int timeoutMs)
{
    const auto deadline =
        std::chrono::steady_clock::now() + std::chrono::milliseconds(timeoutMs);

    while (std::chrono::steady_clock::now() < deadline)
    {
        if (_pending.load(std::memory_order_acquire) == 0)
            return;   // fully flushed

        std::this_thread::sleep_for(std::chrono::milliseconds(10));
    }

    PLOG_WARNING << "[HttpRecordSender] Flush timed out with "
        << _pending.load() << " pending records";
}


void DataLogger::HttpRecordSender::GenerateRecordBody(const Record& record, std::string& str)
{
    std::ostringstream body;
    body << "{"
        << "\"run_id\":" << record.run_id << ","
        << "\"sim_time\":" << record.sim_time << ","
        << "\"parameter\":\"" << record.parameter << "\","
        << "\"value\":" << record.value        
        << "}";

    str = body.str();
}

void DataLogger::HttpRecordSender::Transmitter()
{
    Record record;
    std::string recordBody;
    const std::string url = _baseURL + "/events/";

    while (_queue->pop(record))
    {
        bool success = false;
        auto backoff = INITIAL_BACKOFF;

        GenerateRecordBody(record, recordBody);

        for (int attempt = 1; attempt <= MAX_RETRIES; ++attempt)
        {
            try
            {
                http::Post(url, recordBody, "application/json", _auth->token());
                PLOG_VERBOSE << "Transmission successful";
                success = true;
                break;
            }
            catch (const std::exception& e)
            {
                PLOG_WARNING << "[NetworkLogger] Transmit failed (attempt "
                    << attempt << "): " << e.what();

                if (attempt < MAX_RETRIES)
                    std::this_thread::sleep_for(backoff);

                backoff *= 2;
            }
        }

        if (!success)
        {
            PLOG_WARNING << "[NetworkLogger] Dropping record after "
                << MAX_RETRIES << " failed attempts";
        }

        _pending.fetch_sub(1, std::memory_order_relaxed);
    }

    PLOG_INFO << "[NetworkLogger] Transmitter exiting cleanly";
}
