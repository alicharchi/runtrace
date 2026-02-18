#pragma once
#include <vector>
#include "Record.h"
#include <cstdint>

namespace DataLogger
{
    class IMessageEncoder
    {
    public:
        virtual ~IMessageEncoder() = default;

        virtual std::vector<uint8_t> Encode(const Record &record) const = 0;
    };
}