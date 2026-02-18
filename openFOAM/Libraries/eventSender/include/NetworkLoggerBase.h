#pragma once

#include "IRecordSender.h"
#include "Record.h"
#include "IAuthentication.h"
#include <memory>
#include <string>

namespace DataLogger
{
    class NetworkLoggerBase : public IRecordSender
    {
    public:
        NetworkLoggerBase(const std::string &baseURL, std::unique_ptr<IAuthentication> authentication);
        ~NetworkLoggerBase();

        virtual long int RunId() const override final;

        virtual void Update(json data) override final;
        virtual void MarkEnded(int exitFlag) override final;

    protected:
        const std::string _baseURL;
        std::unique_ptr<IAuthentication> _auth;

    private:
        void RegisterRun();
        long int _runId{-1};
    };
}