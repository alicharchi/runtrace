#include <QApplication>
#include <QtCore>
#include <QtGui>

#include <QMainWindow>
#include <QScopedPointer>
#include <QtCharts/QLineSeries>

#include <QSqlDatabase>
#include <QSqlError>
#include <QSqlQuery>
#include <QMessageBox>
#include <QIcon>
#include <QString>
#include <QTextStream>
#include "plotwindow.h"



int main(int argc, char* argv[])
{
    QApplication app(argc, argv);

    app.setWindowIcon(QIcon("../../icons/118829_monitor_utilities_system_icon.ico"));

    QMessageBox msgBox(nullptr);
    msgBox.setIcon(QMessageBox::Critical);
    msgBox.setWindowTitle("Connection Error");

    msgBox.setStandardButtons(QMessageBox::Yes | QMessageBox::No);
    msgBox.setDefaultButton(QMessageBox::Yes);


    QSqlDatabase db = QSqlDatabase::addDatabase("QPSQL");
    db.setHostName("localhost");
    db.setPort(5432);
    db.setDatabaseName("openFoam");
    db.setUserName("postgres");
    db.setPassword("ali123");

    QMessageBox::StandardButton reply = QMessageBox::Yes;
    while(reply==QMessageBox::Yes)
    {
        if (db.open()) {
            qInfo() << "Successfully connected to PostgreSQL database.";
            reply=QMessageBox::Ok;
        } else {
            qDebug() << "Error connecting to database:" << db.lastError().text();

            msgBox.setText(
                QString("Error connecting to database:\n\n") +
                db.lastError().text() +
                "\n\nDo you want to retry?"
                );

            reply = static_cast<QMessageBox::StandardButton>(msgBox.exec());
        }

        if (reply==QMessageBox::No)
        {
            return 1;
        }
    }
    plotWindow w;

    w.resize(900, 600);
    w.show();

    // Event loop
    return app.exec();
}


