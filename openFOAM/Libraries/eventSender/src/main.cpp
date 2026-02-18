#include <chrono>
#include <memory>

#include "HttpRecordSender.h"
#include "KafkaRecordSender.h"

#include <initializer_list>

#include "LoggerFactory.h"
#include "MsgPackEncoder.h"
#include "IAuthentication.h"
#include "UsrPwdAuthentication.h"

#include <plog/Log.h>
#include <plog/Formatters/TxtFormatter.h>
#include <plog/Initializers/ConsoleInitializer.h>
#include <plog/Initializers/RollingFileInitializer.h>

#include <random>

using namespace std::chrono_literals;
using namespace DataLogger;

const std::string HOST = "192.168.0.30";
const std::string API_PORT = "8001";

static plog::RollingFileAppender<plog::TxtFormatter> fileAppender("log.txt", 1024*1024, 5); 
static plog::ConsoleAppender<plog::TxtFormatter> consoleAppender;

class Timer
{
public:
    Timer()
        :
        _startTimePoint{ std::chrono::high_resolution_clock::now() }
    {
    }

    ~Timer()
    {
        const auto endTimePoint = std::chrono::high_resolution_clock::now();
        auto elapsed_duration = endTimePoint - _startTimePoint;
        long long ms = std::chrono::duration_cast<std::chrono::milliseconds>(elapsed_duration).count();

        std::cout << "Time elapsed:\n";
        std::cout << ms << " milliseconds " << "\n";

    }
private:
    const std::chrono::time_point<std::chrono::high_resolution_clock> _startTimePoint;

};

int DoLogging(IRecordSender* nl, char** argv)
{    
    {
        PLOG_INFO << "Obtained run id " << nl->RunId();
        
        {
            json j = json::array();
            j.push_back({ {"property", "exec"}, {"value", std::string(argv[0])} });
            j.push_back({ {"property", "version"}, {"value", "1712"} });
            j.push_back({ {"property", "nprocs"}, {"value", "2"} });

            
            for (int i = 0; i < 25; i++)
            {
                const std::string property = "test" + std::to_string(i);
                const std::string value = "v" + std::to_string(i);
                j.push_back({ {"property", property}, {"value", value} });
            }            

            nl->Update(j);
        }

        Record r ;
        r.run_id = nl->RunId();

        bool result;

        unsigned seed = (unsigned) std::chrono::system_clock::now().time_since_epoch().count();
        std::mt19937 gen(seed);            
        std::uniform_int_distribution<> dis(1, 1000);

        for (int i = 1; i <= 100; ++i)
        {
            double simTime = i;

            if (i % 100 == 0) {
                PLOG_DEBUG << " Sent " << i << " to queue";
            }
            r.sim_time = simTime;            
            r.parameter = "P1";
            r.value = 0.7 + static_cast<double>(dis(gen)) / 100.0;                    
            result = nl->Submit(r);
            if (!result)
            {
                PLOG_WARNING << "Dropped " << i;
            }            
            //std::this_thread::sleep_for(std::chrono::seconds(1));
        }
        
        std::this_thread::sleep_for(std::chrono::seconds(1));
        nl->MarkEnded(0);
        nl->Flush(1000);
        PLOG_INFO << "Done";
    }

    PLOG_INFO << "Closing";

    return 0;
}

int main(int argc, char** argv)
{
    plog::init(plog::debug, &consoleAppender).addAppender(&fileAppender);
    PLOG_INFO << "Initialized logger";

    const std::string BASE_URL = "http://" + HOST + ":" + API_PORT;

    const auto userName = "user@test.com";
    const auto password = "test!12345678";
    /*
    {
        Timer timer;
        PLOG_INFO << "Logging with Newtwork";
        auto auth = std::make_unique<UsrPwdAuthentication>(BASE_URL, userName, password);
        auto httpLogger = LoggerFactory::CreateLogger<HttpRecordSender>(
        std::move(auth),BASE_URL, HttpRecordSender::OverflowPolicy::Block);

        DoLogging(httpLogger.get(), argv);
        PLOG_INFO << "Done logging, cleaning up ...";
    }    
    
    PLOG_INFO << "Done";

    */
    {
        Timer timer;
        PLOG_INFO << "Logging with Kafka";
        auto auth = std::make_unique<UsrPwdAuthentication>(BASE_URL, userName, password);
        
        auto kafkaLogger = LoggerFactory::CreateLoggerWithEncoder<KafkaRecordSender, MsgPackEncoder>(
            std::move(auth), BASE_URL, HOST + ":9092", "events");

        DoLogging(kafkaLogger.get(), argv);
        PLOG_INFO << "Done logging, cleaning up ...";
    }
    PLOG_INFO << "Done";    
    
    return 0;
}