#ifndef CUSTOMSERIESCHART_H
#define CUSTOMSERIESCHART_H

#include <QWidget>
#include <QVBoxLayout>
#include <QtCharts/QValueAxis>
#include <QtCharts/QChartView>
#include <QtCharts/QLineSeries>
#include <QComboBox>

#include "plotData.h"

class CustomSeriesChart : public QWidget
{
    Q_OBJECT

public:
    explicit CustomSeriesChart(const PlotData* const plotData, QWidget *parent = nullptr);
    ~CustomSeriesChart();

    void Update();

private slots:

    void SelectionChanged(int i);

private:
    const PlotData* const _plotData;

    QChartView *chartView;
    QChart *chart;
    QLineSeries data_series;
    QValueAxis *axisX,*axisY;
    QComboBox *cmbParams;
    QComboBox *cmbIter;

    int _runId;

    void LinkDataToWidget(QComboBox *cmb, QString field);
    void PopulateParameters();
    void PopulateIters();
    void Plot();

};

#endif // MYCONTAINERWIDGET_H


