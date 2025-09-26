#ifndef PLOTWINDOW_H
#define PLOTWINDOW_H

#include <QWidget>
#include <QApplication>

#include <QGridLayout>
#include <QToolBar>
#include <QAction>
#include <QComboBox>

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
    int _runId;
    QLineSeries _data_series;

    void SetupToolbar();
    void PopulateFields();
    void RefreshData(const double samplingTime);

private slots:
    void Save();

    void Close();

    void ChangeSeries(const QString &text);

public:
    explicit plotWindow(int runId, QWidget* parent = nullptr);

    ~plotWindow();

    void AddSeries(QLineSeries* series);
    void SetRunID(int runId);

};

#endif // PLOTWINDOW_H
