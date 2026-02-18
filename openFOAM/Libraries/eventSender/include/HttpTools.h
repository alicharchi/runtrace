#pragma once

#include <string>

#include "JsonLib.h"

namespace http
{
    std::string Get(
        const std::string& url, 
        const std::string& token=""
    );

    int Post(
        const std::string& url, 
        const std::string& body, 
        const std::string& contentType, 
        const std::string& token=""
    );
    
    json PostAndReturn(
        const std::string& url, 
        const std::string& body, 
        const std::string& contentType, 
        const std::string& token=""
    );

    int Put(
        const std::string& url, 
        const std::string& body, 
        const std::string& contentType, 
        const std::string& token=""
    );
}