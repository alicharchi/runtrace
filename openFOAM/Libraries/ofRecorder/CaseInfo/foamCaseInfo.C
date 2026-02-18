#include "foamCaseInfo.H"

#include "foamVersion.H"
#include "argList.H"
#include "clock.H"
#include "OSspecific.H"
#include "Pstream.H"
#include "clock.H"
#include <sstream>

Foam::FoamCaseInfo::FoamCaseInfo(int argc, char *argv[])
    : _keys{"Build", "Arch", "Version", "Exec", "Date", "Time", "Host", "PID", "Case", "nProcs"}
{
    Generate(argc, argv);
}

const Foam::wordList& Foam::FoamCaseInfo::Keys() const
{
    return _keys;
}

const Foam::wordList& Foam::FoamCaseInfo::Values() const
{
    return _values;
}

void Foam::FoamCaseInfo::Generate(int argc, char* argv[])
{
    _values.append(FOAMbuild);

    _values.append(FOAMbuildArch);

    _values.append(FOAMversion);
    
    argList args(argc, argv);
    std::ostringstream exec;
    exec << args.executable();
    if (Pstream::parRun()) exec << " -parallel";
    _values.append(exec.str());
    
    _values.append(clock::date());
    _values.append(clock::clockTime());

    _values.append(hostName());
    
    std::ostringstream pidStr;
    pidStr << pid();
    _values.append(pidStr.str());
    
    _values.append(args.rootPath() + "/" + args.caseName());

    std::ostringstream nprocs;
    nprocs << Pstream::nProcs();
    _values.append(nprocs.str());
}