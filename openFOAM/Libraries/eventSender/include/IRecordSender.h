#pragma once

#include "Record.h"
#include <string>

#include "HttpTools.h"

namespace DataLogger
{
	struct IRecordSender
	{
		IRecordSender() = default;
		virtual ~IRecordSender() = default;

		virtual long int RunId() const = 0;
		virtual void Update(json data) = 0;
		virtual bool Submit(const Record &record) noexcept = 0;
		virtual void MarkEnded(int exitFlag) = 0;
		virtual void Flush(int timeoutMs) = 0;
	};
}