#pragma once

#include "NetworkLoggerBase.h"
#include "Record.h"
#include "BoundedQueue.h"
#include "IAuthentication.h"

#include <atomic>
#include <memory>
#include <string>
#include <thread>

namespace DataLogger
{
    class HttpRecordSender : public NetworkLoggerBase
    {
    public:
        enum class OverflowPolicy
        {
            Drop,
            Block
        };

        HttpRecordSender(
            const std::string &baseURL,
            OverflowPolicy policy,
            std::unique_ptr<IAuthentication> authentication);

        ~HttpRecordSender() override;

        bool Submit(const Record &record) noexcept override;
        virtual void Flush(int timeoutMs = 0) override;

    private:
        void GenerateRecordBody(const Record &record, std::string &str);
        void Transmitter();

    private:
        std::unique_ptr<BoundedQueue<Record>> _queue;
        std::thread _consumer;
        std::atomic<bool> _running{true};
        const OverflowPolicy _policy;
        std::atomic<size_t> _pending{0};
    };
}