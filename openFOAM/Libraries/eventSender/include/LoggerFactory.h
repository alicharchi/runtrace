#pragma once
#include <memory>
#include "IRecordSender.h"
#include "IMessageEncoder.h"
#include "IAuthentication.h"

namespace DataLogger
{
    class LoggerFactory
    {
    public:
        template <typename LoggerT, typename EncoderT, typename... Args>
        static std::unique_ptr<IRecordSender> CreateLoggerWithEncoder(
            std::unique_ptr<IAuthentication> auth,
            Args &&...args)
        {
            auto encoder = std::make_unique<EncoderT>();
            return std::make_unique<LoggerT>(
                std::forward<Args>(args)...,
                std::move(auth),
                std::move(encoder));
        }

        template <typename LoggerT, typename... Args>
        static std::unique_ptr<IRecordSender> CreateLogger(
            std::unique_ptr<IAuthentication> auth,
            Args &&...args)
        {
            return std::make_unique<LoggerT>(
                std::forward<Args>(args)...,
                std::move(auth));
        }
    };
}