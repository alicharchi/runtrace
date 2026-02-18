#ifndef FoamCaseInfo_H
#define FoamCaseInfo_H

#include "wordList.H"

namespace Foam
{
    class FoamCaseInfo
    {
            wordList _keys,_values; 
            void Generate(int argc, char* argv[]);
        public:
            
            FoamCaseInfo(int argc, char* argv[]);

            const wordList& Keys() const;
            const wordList& Values() const;
    };
}

#endif