# Runtrace

Runtrace is a **lightweight simulation run tracking** system that leverages Apache Kafka event streaming for scalable, high-throughput logging and lifecycle tracking. Originally built for OpenFOAM simulations, it supports general scientific and engineering workflows and provides email notifications on run completion and status updates.

## Features

- Microservices-based architecture
- Backend API for run lifecycle management
- Asynchronous consumers and notifiers
- Database-backed persistence
- Docker Compose–based local setup

## Structure

- **backend**: API services (Python)
- **consumer**: Background event stream processing (Python)
- **notifier**: Notification service
- **database**: PostgreSQL database
- **streaming broker**: Apache Kafka
- **development email server**: Mailpit
- **frontend**: Web UI (React)
- **producer**: Sample event producers (Python)
- **openfoam**: OpenFOAM data collection libraries and examples (C++)

## Tools and Libraries Used

- [Apache Kafka](https://kafka.apache.org/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://react.dev/)
- [Bootstrap](https://getbootstrap.com/)
- [Docker](https://www.docker.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [Sqlalchemy](https://www.sqlalchemy.org/)
- [Sqlmodel](https://sqlmodel.tiangolo.com/)
- [MessagePack](https://msgpack.org/) (C++ / Python)
- [Boost C++ Libraries](https://www.boost.org/)
- [OpenFOAM](https://www.openfoam.com/)
- [Mailpit](https://mailpit.axllent.org/)
- [pLogger](https://github.com/SergiusTheBest/plog)
- [nlohmann/json](https://github.com/nlohmann/json)
- [CPR (C++ Requests)](https://github.com/libcpr/cpr)
- [CMake](https://cmake.org/)


## License

MIT
