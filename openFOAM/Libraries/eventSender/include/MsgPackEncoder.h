#include "IMessageEncoder.h"

namespace DataLogger
{
    class MsgPackEncoder : public IMessageEncoder
    {
    public:
        std::vector<uint8_t> Encode(const Record &record) const override;
    };
}
