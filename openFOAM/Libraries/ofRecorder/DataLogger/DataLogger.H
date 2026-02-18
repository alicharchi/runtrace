#ifndef DataLogger_H
#define DataLogger_H

#include "autoPtr.H"
#include "dictionary.H"
#include "wordList.H"



namespace Foam
{

    class FoamDataLogger
    {
        struct Impl;
        autoPtr<Impl> _pimpl;
        const dictionary& _dict;
        word _topic;

    public:
        FoamDataLogger(const dictionary& dict);
        ~FoamDataLogger();

        void RecordLog(scalar simTime, word parameter, scalar value);
        void UpdateRun(const wordList& keys, const wordList& values);
        void EndRun(label exitFlag);
        void Flush(label timeout);
    };

} 

#endif
