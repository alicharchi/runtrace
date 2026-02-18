#pragma once

#include <string>

namespace DataLogger
{
    struct Record
    {
        int run_id;
        double sim_time;
        std::string parameter;
        double value;
    };
}