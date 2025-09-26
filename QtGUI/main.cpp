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

int main(int argc, char* argv[])
{
    QApplication app(argc, argv);

    QSqlDatabase db = QSqlDatabase::addDatabase("QPSQL"); // Specify the PostgreSQL driver
    db.setHostName("localhost"); // Or the IP address of your PostgreSQL server
    db.setPort(5432); // Default PostgreSQL port
    db.setDatabaseName("openFoam");
    db.setUserName("postgres");
    db.setPassword("ali123");

    if (db.open()) {
        qInfo() << "Successfully connected to PostgreSQL database.";
        // You can now perform database operations using QSqlQuery
    } else {
        qDebug() << "Error connecting to database:" << db.lastError().text();
    }

    //QMainWindow window;

    // Create a widget
    QScopedPointer<plotWindow> w = QScopedPointer<plotWindow>(new plotWindow(1));

    //window.setCentralWidget(w);
    //window.resize(900, 600);
    //window.show();

    w->resize(900, 600);
    w->show();

    // Event loop
    return app.exec();
}


