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

#include <QtCharts/QValueAxis>
#include <QtCharts/QLogValueAxis>
#include <QtCharts/QChartView>
#include <QtCharts/QLineSeries>

class plotWindow : public QWidget
{
    Q_OBJECT

    QGridLayout *gridLayout;
    QToolBar* toolbar;
    QChartView *chartView;
    QChart *chart;

    QAction *saveAction;
    QAction *closeAction;
    QComboBox *cmbParmas;
    QComboBox *cmbIters;
    QLineEdit *minXBox;
    QLineEdit *maxXBox;
    QAction *updateLimitsAction;
    int _runId;
    double _minX,_maxX;
    QLineSeries _data_series;

    QValueAxis *_axisX,*_axisY;

    void SetupToolbar();
    void PopulateFields();
    void SetupChart();

private slots:
    void Save();

    void Close();

    void UpdateLimits();

    void ChangeSeries(const QString &text);

public:
    explicit plotWindow(int runId, QWidget* parent = nullptr);

    ~plotWindow();

    //void AddSeries(QLineSeries* series);
    void SetRunID(int runId);

    void RefreshData(const double samplingTime);

};

#endif // PLOTWINDOW_H
