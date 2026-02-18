#include "DataLogger.H"

#include <memory>

#include "HttpRecordSender.h"
#include "KafkaRecordSender.h"
#include "LoggerFactory.h"
#include "MsgPackEncoder.h"
#include "IRecordSender.h"
#include "IAuthentication.h"
#include "UsrPwdAuthentication.h"

#include <plog/Log.h>
#include <plog/Formatters/TxtFormatter.h>
#include <plog/Initializers/ConsoleInitializer.h>
#include <plog/Initializers/RollingFileInitializer.h>

namespace
{
    void initLogging()
    {
        static bool initialized = false;
        if (!initialized)
        {
            static plog::RollingFileAppender<plog::TxtFormatter>
                fileAppender("dataLogger_log.txt", 1024*1024, 5);
            static plog::ConsoleAppender<plog::TxtFormatter> consoleAppender;

            plog::init(plog::info, &fileAppender).addAppender(&consoleAppender);
            initialized = true;
        }
    }
}

// * * * * * * * * * * * * * * * Impl * * * * * * * * * * * * * * //

struct Foam::FoamDataLogger::Impl
{    
    std::unique_ptr<DataLogger::IRecordSender> _logger;    
};

// * * * * * * * * * * * * * * * Constructors * * * * * * * * * * //

Foam::FoamDataLogger::FoamDataLogger(const dictionary& dict)
:
_dict(dict)
{
    initLogging();
    using namespace DataLogger;
    _pimpl.reset(new Impl());

    PLOG_INFO << "Initializing kafka logger";
    const auto& apiSubDict = _dict.subDict("api");
    Foam::word apiHost; apiSubDict.readEntry("host", apiHost);    
    Foam::word apiPort; apiSubDict.readEntry("port", apiPort);    
    const std::string apiURL = "http://" + apiHost + ":" + apiPort;

    Foam::word userName; apiSubDict.readEntry("username", userName);
    Foam::word password; apiSubDict.readEntry("password", password);

    const auto& brokerSubDict = _dict.subDict("broker");
    Foam::word brokerHost; brokerSubDict.readEntry("host",brokerHost);
    Foam::word brokerPort; brokerSubDict.readEntry("port",brokerPort);
    
    brokerSubDict.readEntry("topic",_topic);

    const std::string brokerURL = brokerHost + ":" + brokerPort;

    auto encoder = std::make_unique<MsgPackEncoder>();
    auto auth = std::make_unique<UsrPwdAuthentication>(apiURL, userName, password);            

    _pimpl->_logger = std::make_unique<KafkaRecordSender>        
        (
            apiURL, brokerURL , _topic , std::move(auth), std::move(encoder)
        );
}

Foam::FoamDataLogger::~FoamDataLogger()
{
    
}

void Foam::FoamDataLogger::RecordLog(scalar simTime, word parameter, scalar value)
{
    DataLogger::Record r;
    r.run_id = _pimpl->_logger->RunId();
    r.sim_time = simTime;
    r.parameter = parameter;
    r.value = value;
    _pimpl->_logger->Submit(r);    
}

void Foam::FoamDataLogger::UpdateRun(const wordList& keys, const wordList& values)
{
    if (keys.size() != values.size())
    {
        FatalErrorInFunction
            << "keys and values have different sizes!" << exit(FatalError);
    }

    json j = json::array();

    for (label i = 0; i < keys.size(); ++i)
    {
        j.push_back({ {"property", keys[i]}, {"value", values[i]} });
    }

    if (!_pimpl || !_pimpl->_logger)
    {
        FatalErrorInFunction
            << "Logger is not initialized!" << exit(FatalError);
    }

    _pimpl->_logger->Update(j);  
}


void Foam::FoamDataLogger::EndRun(label exitFlag)
{
    _pimpl->_logger->MarkEnded(exitFlag);
}

void Foam::FoamDataLogger::Flush(label timeout)
{
    _pimpl->_logger->Flush(timeout);
}