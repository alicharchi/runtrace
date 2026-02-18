cmake_minimum_required(VERSION 3.15)

project(event_sender_project
    VERSION 1.0
    LANGUAGES CXX
)

# ------------------------------------------------------------------------------
# Global settings
# ------------------------------------------------------------------------------
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

# ------------------------------------------------------------------------------
# Dependencies
# ------------------------------------------------------------------------------
include(FetchContent)

# ---- pkg-config (for librdkafka)
find_package(PkgConfig REQUIRED)

pkg_check_modules(RDKAFKA REQUIRED rdkafka++)

add_library(RdKafka::rdkafka++ UNKNOWN IMPORTED)
set_target_properties(RdKafka::rdkafka++ PROPERTIES
    IMPORTED_LOCATION "${RDKAFKA_LINK_LIBRARIES}"
    INTERFACE_INCLUDE_DIRECTORIES "${RDKAFKA_INCLUDE_DIRS}"
)

# ---- libcurl
find_package(CURL REQUIRED)

find_package(msgpack-cxx REQUIRED)

# ---- CPR 
FetchContent_Declare(
    cpr
    GIT_REPOSITORY https://github.com/libcpr/cpr.git
    GIT_TAG 1.10.5
)

FetchContent_MakeAvailable(cpr)

# ---- plog (header-only)
add_library(plog INTERFACE)
target_include_directories(plog
    INTERFACE
        ${CMAKE_CURRENT_SOURCE_DIR}/include
)

# ---- nlohmann/json (header-only)
add_library(nlohmann_json INTERFACE)
target_include_directories(nlohmann_json
    INTERFACE
        ${CMAKE_CURRENT_SOURCE_DIR}/external/nlohmann
)

# ------------------------------------------------------------------------------
# eventSender shared library
# ------------------------------------------------------------------------------
add_library(eventSender SHARED
    src/HttpRecordSender.cpp
    src/HttpTools.cpp
    src/KafkaRecordSender.cpp
    src/MsgPackEncoder.cpp
    src/NetworkLoggerBase.cpp
    src/UsrPwdAuthentication.cpp
)

target_include_directories(eventSender
    PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}/include
)

target_link_libraries(eventSender
    PRIVATE
        RdKafka::rdkafka++
        cpr::cpr
        CURL::libcurl
        plog
        nlohmann_json
        msgpack-cxx
)

# ------------------------------------------------------------------------------
# Executable
# ------------------------------------------------------------------------------
add_executable(eventSenderApp
    src/main.cpp
)

target_link_libraries(eventSenderApp
    PRIVATE
        eventSender
)

target_include_directories(eventSenderApp
    PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}/include
)

# ------------------------------------------------------------------------------
# Output names
# ------------------------------------------------------------------------------
set_target_properties(eventSenderApp PROPERTIES
    OUTPUT_NAME "eventSenderApp"
)
