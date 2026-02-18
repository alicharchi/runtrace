#include "UsrPwdAuthentication.h"
#include <plog/Log.h> 
#include <sstream>

#include "HttpTools.h"

DataLogger::UsrPwdAuthentication::UsrPwdAuthentication
(
    const std::string& baseURL,
    const std::string& userName, 
    const std::string& password
)
    :
    _baseURL(baseURL),
    _userName(userName),
    _password(password),
    _token("")
{
}

const std::string& DataLogger::UsrPwdAuthentication::token() const
{
    if (_token == "")
    {
        PLOG_WARNING << "Attempting to access empty token, Please retrieve token before use.";
    }
    return _token;
}

void DataLogger::UsrPwdAuthentication::RetrieveToken()
{
    Authenticate(_userName, _password);
}

void DataLogger::UsrPwdAuthentication::Authenticate(const std::string& userName, const std::string& password)
{
    PLOG_DEBUG << "Attempting to authenticate";
    try
    {
        const auto url = _baseURL + "/auth/login";
        std::stringstream payload_s;
        payload_s << "username=" << userName << "&password=" << password;
        const auto response = http::PostAndReturn(url, payload_s.str(), "application/x-www-form-urlencoded");
        _token = response["access_token"];
    }
    catch (const std::exception& e) {
        PLOG_ERROR << "Exception in UsrPwdAuthentication::Authenticate: " << e.what();
    }
    catch (...) {
        PLOG_ERROR << "Unknown exception in UsrPwdAuthentication::Authenticate.";
    }
}