#include "HttpTools.h"
#include <cpr/cpr.h>
#include <plog/Log.h> 
#include <sstream>

std::string http::Get(
    const std::string& url,
    const std::string& token
)
{    
    cpr::Response r = cpr::Get(cpr::Url{ url },cpr::Header{ {"Authorization", "Bearer " + token} });
    if (r.status_code != 200)
    {
        std::stringstream s;

        s << "HTTP GET Status code: " << r.status_code;
        s << " URL: " << url;
        s << " Header: ";
        for (const std::pair<const std::basic_string<char>, std::basic_string<char>>& kv : r.header) {
            s << "[" << kv.first << "]:" << kv.second;
        }

        PLOG_ERROR << s.str();
    }
    return r.text;
}

int http::Post(
    const std::string& url, 
    const std::string& body,
    const std::string& contentType,
    const std::string& token
)
{
    cpr::Response r = cpr::Post(
        cpr::Url{ url },
        (
            token == "" ?
            cpr::Header{ {"Content-Type", contentType} }
            :
            cpr::Header{ {"Content-Type", contentType} , {"Authorization", "Bearer " + token} }
        ),
        cpr::Body{ body }
    );

    if (r.status_code != 200) 
    {
        PLOG_ERROR << "HTTP POST Status: " << r.status_code << ", URL: " << url
            << ", text:" << r.text;
    }
    return r.status_code;
}

json http::PostAndReturn(
    const std::string& url,
    const std::string& body,
    const std::string& contentType,
    const std::string& token
)
{
    cpr::Response r = cpr::Post(
        cpr::Url{ url },
        (
            token=="" ?
            cpr::Header{ {"Content-Type", contentType} }
            :
            cpr::Header{ {"Content-Type", contentType} , {"Authorization", "Bearer " + token} }
        ),        
        cpr::Body{ body }
    );

    if (r.status_code != 200)
    {
        PLOG_ERROR << "HTTP POST Status: " << r.status_code << ", URL: " << url
            << ", text:" << r.text;
    }
    return json::parse(r.text);
}

int http::Put(
    const std::string& url,     
    const std::string& body, 
    const std::string& contentType,
    const std::string& token
)
{
    cpr::Response r = cpr::Put(
        cpr::Url{ url },
        (
            token == "" ?
            cpr::Header{ {"Content-Type", contentType} }
            :
            cpr::Header{ {"Content-Type", contentType} , {"Authorization", "Bearer " + token} }
        ),
        cpr::Body{ body }
    );

    if (r.status_code != 200)
    {
        PLOG_ERROR << "HTTP PUT Status: " << r.status_code << ", URL: " << url
            << ", text:" << r.text;
    }

    return r.status_code;    
}
