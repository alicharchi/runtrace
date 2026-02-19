# Runtrace

Runtrace is a lightweight **simulation run tracking system** for monitoring, managing, and coordinating computational runs. It was initially designed for monitoring OpenFOAM runs but can be used in any scientific or engineering workflow where run state, metadata, and lifecycle tracking are essential.

---

## Features

- Microservices-based architecture
- Backend API for run lifecycle management
- Asynchronous consumers and notifiers
- Database-backed persistence
- Docker Compose–based local setup

---

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

---

## Tools and Libraries Used

- [Apache Kafka](https://kafka.apache.org/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://react.dev/)
- [Bootstrap](https://getbootstrap.com/)
- [Docker](https://www.docker.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [Sqlalchemy](https://www.sqlalchemy.org/)
- [MessagePack](https://msgpack.org/) (C++ / Python)
- [Boost C++ Libraries](https://www.boost.org/)
- [OpenFOAM](https://www.openfoam.com/)
- [Mailpit](https://mailpit.axllent.org/)
- [pLogger](https://github.com/SergiusTheBest/plog)
- [nlohmann/json](https://github.com/nlohmann/json)
- [CPR (C++ Requests)](https://github.com/libcpr/cpr)
- [CMake](https://cmake.org/)


---

## License

MIT
