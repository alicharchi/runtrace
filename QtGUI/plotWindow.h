#ifndef PLOTWINDOW_H
#define PLOTWINDOW_H

#include <QWidget>
#include <QApplication>
#include <QGridLayout>
#include <QToolBar>
#include <QAction>
#include <QComboBox>
#include <QLabel>
#include <QLineEdit>
#include <QTableView>
#include <QtCharts/QValueAxis>
#include <QtCharts/QChartView>
#include <QtCharts/QLineSeries>
#include <QTimer>
#include <QSqlQuery>
#include <QList>

#include "plotData.h"
#include "customserieschart.h"

class plotWindow : public QWidget
{
    Q_OBJECT

    PlotData plotData;
    QGridLayout *gridLayout;
    QToolBar* toolbar;
    QTableView* runsView;
    QAction *saveAction;
    QAction *closeAction;
    QLineEdit *minXBox;
    QLineEdit *maxXBox;
    QAction *updateLimitsAction;
    QTimer* _timer;    
    QList<CustomSeriesChart*> charts;

    void SetupToolbar();
    void SetupRunsTable();
    void SetupCharts();        

private slots:
    void Save();
    void Close();
    void UpdateLimits();
    void UpdateCharts();

    void RunsSelectionChanged(const QModelIndex &current, const QModelIndex &previous);
    void timerTick();

public:
    explicit plotWindow(QWidget* parent = nullptr);
    ~plotWindow();
};

#endif // PLOTWINDOW_H
