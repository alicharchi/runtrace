#include "NetworkLoggerBase.h"
#include <plog/Log.h> 
#include <sstream>

using namespace std::chrono_literals;

namespace
{
    constexpr size_t QUEUE_CAPACITY = 1024;
    constexpr int MAX_RETRIES = 5;
    constexpr auto INITIAL_BACKOFF = 100ms;
}

DataLogger::NetworkLoggerBase::NetworkLoggerBase(
    const std::string& baseURL,
    std::unique_ptr<IAuthentication> authentication
)
    : _baseURL(baseURL),
    _auth(move(authentication))
{
    _auth->RetrieveToken();    
    RegisterRun();
}

DataLogger::NetworkLoggerBase::~NetworkLoggerBase()
{
}

long int DataLogger::NetworkLoggerBase::RunId() const
{
    return _runId;
}

void DataLogger::NetworkLoggerBase::Update(json data)
{
    if (_runId < 0)
        return;

    try
    {
        http::Post(_baseURL + "/runinfo/" + std::to_string(_runId), data.dump(), "application/json", _auth->token());
    }
    catch (...)
    {
        PLOG_ERROR << "Update failed";
    }
}

void DataLogger::NetworkLoggerBase::MarkEnded(int exitFlag)
{
    if (_runId < 0)
        return;    
    try
    {
        PLOG_INFO << std::string("[NetworkLogger] Marking run ") 
            + std::to_string(_runId) + " ended with exit flag " 
            + std::to_string(exitFlag);

        json payload;
        payload["exitflag"] = exitFlag;        
        http::Put(_baseURL + "/runs/" + std::to_string(_runId) + "/ended",
            payload.dump(),
            "application/json",
            _auth->token());
    }
    catch (...)
    {
        PLOG_ERROR << "Update failed";
    }
}

void DataLogger::NetworkLoggerBase::RegisterRun()
{
    auto data = http::PostAndReturn(_baseURL + "/runs/", "{}", "application/json", _auth->token());
    _runId = data.at("id");
    PLOG_DEBUG << "Run registered as " << _runId;
}
