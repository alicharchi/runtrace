#pragma once

#include <queue>
#include <mutex>
#include <condition_variable>
#include <utility>

template <typename T>
class BoundedQueue {
public:
    explicit BoundedQueue(size_t capacity)
        : capacity_(capacity) {
    }
        
    void push(const T& item) {
        push_impl(item);
    }
    
    void push(T&& item) {
        push_impl(std::move(item));
    }
    
    template <typename... Args>
    void emplace(Args&&... args) {
        std::unique_lock<std::mutex> lock(mutex_);
        not_full_.wait(lock, [&] {
            return queue_.size() < capacity_ || done_;
            });

        if (done_) return;

        queue_.emplace(std::forward<Args>(args)...);
        not_empty_.notify_one();
    }
        
    bool try_emplace(const T& value)
    {
        std::lock_guard<std::mutex> lock(mutex_);
        if (queue_.size() >= capacity_)
            return false;

        queue_.emplace(value);
        not_empty_.notify_one();
        return true;
    }

    bool pop(T& item) {
        std::unique_lock<std::mutex> lock(mutex_);
        not_empty_.wait(lock, [&] {
            return !queue_.empty() || done_;
            });

        if (queue_.empty())
            return false;

        item = std::move(queue_.front());
        queue_.pop();
        not_full_.notify_one();
        return true;
    }

    void shutdown() {
        {
            std::lock_guard<std::mutex> lock(mutex_);
            done_ = true;
        }
        not_empty_.notify_all();
        not_full_.notify_all();
    }

private:
    template <typename U>
    void push_impl(U&& item) {
        std::unique_lock<std::mutex> lock(mutex_);
        not_full_.wait(lock, [&] {
            return queue_.size() < capacity_ || done_;
            });

        if (done_) return;

        queue_.push(std::forward<U>(item));
        not_empty_.notify_one();
    }

private:
    std::queue<T> queue_;
    size_t capacity_;
    bool done_{ false };

    std::mutex mutex_;
    std::condition_variable not_empty_;
    std::condition_variable not_full_;
};
