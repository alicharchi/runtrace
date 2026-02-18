#pragma once
#include <string>

namespace DataLogger
{
	struct IAuthentication
	{
		virtual ~IAuthentication() = default;

		virtual const std::string &token() const = 0;
		virtual void RetrieveToken() = 0;
	};
}