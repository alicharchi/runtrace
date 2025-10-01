#include <QApplication>
#include <QtCore>
#include <QtGui>

#include <QMainWindow>
#include <QScopedPointer>
#include <QtCharts/QLineSeries>

#include <QSqlDatabase>
#include <QSqlError>
#include <QSqlQuery>

#include <QString>
#include <QTextStream>
#include "plotwindow.h"

#include <QTimer>

int main(int argc, char* argv[])
{
    QApplication app(argc, argv);

    QSqlDatabase db = QSqlDatabase::addDatabase("QPSQL");
    db.setHostName("localhost");
    db.setPort(5432);
    db.setDatabaseName("openFoam");
    db.setUserName("postgres");
    db.setPassword("ali123");

    if (db.open()) {
        qInfo() << "Successfully connected to PostgreSQL database.";
        // You can now perform database operations using QSqlQuery
    } else {
        qDebug() << "Error connecting to database:" << db.lastError().text();
    }

    plotWindow w;

    QTimer timer;
    // Connect the timeout signal to a lambda function to update the label
    QObject::connect(&timer, &QTimer::timeout, [&w]() {
        w.RefreshData(1.0);
        qInfo() << "Calling refresh.";
    });

    // Start the timer to fire every 1000 milliseconds (1 second)
    timer.start(3000);

    //window.setCentralWidget(w);
    //window.resize(900, 600);
    //window.show();

    w.resize(900, 600);
    w.show();

    // Event loop
    return app.exec();
}


