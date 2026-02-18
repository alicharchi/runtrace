#include "MsgPackEncoder.h"
#include <msgpack.hpp>

std::vector<uint8_t> DataLogger::MsgPackEncoder::Encode(const Record& record) const 
{
    msgpack::sbuffer buffer;
    msgpack::packer<msgpack::sbuffer> pk(buffer);
    
    pk.pack_map(5);
    pk.pack("_v"); pk.pack(1);
    pk.pack("run_id");    pk.pack(record.run_id);
    pk.pack("sim_time");  pk.pack(record.sim_time);
    pk.pack("parameter"); pk.pack(record.parameter);
    pk.pack("value");     pk.pack(record.value);    
    
    return std::vector<uint8_t>(buffer.data(), buffer.data() + buffer.size());
}
