#pragma once
#include "IAuthentication.h"

namespace DataLogger
{
	class UsrPwdAuthentication : public IAuthentication
	{
	public:
		UsrPwdAuthentication(
			const std::string &baseURL,
			const std::string &userName,
			const std::string &password);

		const std::string &token() const override;
		void RetrieveToken() override;

	private:
		const std::string _baseURL;
		const std::string _userName;
		const std::string _password;
		std::string _token;

		void Authenticate(const std::string &userName, const std::string &password);
	};
}