#include "customserieschart.h"
#include <QLabel>
#include <QSqlQuery>
#include <QSqlError>

CustomSeriesChart::CustomSeriesChart(const PlotData* const plotData, QWidget *parent)
    :
    QWidget(parent),
    _plotData(plotData),
    _runId(-1)
{    
    QVBoxLayout *l = new QVBoxLayout(this);
    QHBoxLayout *topRow = new QHBoxLayout();

    chart = new QChart();
    chartView = new QChartView(chart);
    axisX = new QValueAxis();
    axisY = new QValueAxis();
    chart->addAxis(axisX, Qt::AlignBottom);
    chart->addAxis(axisY, Qt::AlignLeft);

    data_series.setName("Series 1");
    chart->addSeries(&data_series);
    data_series.attachAxis(axisX);
    data_series.attachAxis(axisY);

    cmbParams = new QComboBox(this);
    cmbParams->setObjectName("cmbParams");

    cmbIter = new QComboBox(this);
    cmbIter->setObjectName("cmbIters");

    topRow->addWidget(new QLabel("Param:"));
    topRow->setAlignment(Qt::AlignLeft);
    topRow->addWidget(cmbParams);
    topRow->addWidget(new QLabel("Iter:"));
    topRow->addWidget(cmbIter);
    l->addLayout(topRow);

    l->addWidget(chartView);
    setLayout(l);

    connect(cmbParams, &QComboBox::currentIndexChanged, this, &CustomSeriesChart::SelectionChanged);
    connect(cmbIter, &QComboBox::currentIndexChanged, this, &CustomSeriesChart::SelectionChanged);

    PopulateParameters();
    PopulateIters();
    Plot();
}

CustomSeriesChart::~CustomSeriesChart()
{}

void CustomSeriesChart::Update()
{
    qInfo() << __FUNCTION__ << ": " << "Updating with id [" << _plotData->runId << "]" ;
    if (_runId!=_plotData->runId)
    {
        PopulateParameters();
        PopulateIters();
    }
    _runId = _plotData->runId;
    Plot();
}

void CustomSeriesChart::LinkDataToWidget(QComboBox *cmb, QString field)
{
    qInfo() << __FUNCTION__ << ": " << "Updating [" << cmb->objectName() << "]" ;
    if (_plotData->runId == -1)
        return;

    QSqlQuery q(QStringLiteral("SELECT DISTINCT \"%1\" FROM events WHERE run_id=%2;").arg(field).arg(_plotData->runId));
    QStringList items;
    while (q.next())
        items.append(q.value(0).toString());

    cmb->clear();
    cmb->addItems(items);
    if (cmb->count()>0)
    {
        cmb->setCurrentIndex(0);
    }
}

void CustomSeriesChart::PopulateParameters()
{
    LinkDataToWidget(cmbParams,"parameter");
}

void CustomSeriesChart::PopulateIters()
{
    LinkDataToWidget(cmbIter,"iter");
}

void CustomSeriesChart::Plot()
{
    qInfo() << __FUNCTION__ << ": " << "Called plot "
            << " run:" << _plotData->runId
            << " p:" << cmbParams->currentText()
            << " i:" << cmbIter->currentText() ;

    if (_plotData->runId < 0 || cmbParams->count()<=0 || cmbIter->count()<=0)
        return;

    const QString param = cmbParams->currentText();
    const int iter = cmbIter->currentText().toInt();

    QSqlQuery q;
    q.prepare(QString("SELECT FLOOR(sim_time / :samplingTime) * :samplingTime AS sim_time_bin, MIN(value) AS x FROM events ")
              + "WHERE run_id=:rid AND parameter=:p AND iter=:i AND sim_time>=:minT  AND sim_time<=:maxT " +
              "GROUP BY sim_time_bin ORDER BY sim_time_bin;");
    q.bindValue(":rid", _plotData->runId);
    q.bindValue(":p", param);
    q.bindValue(":i", iter);
    q.bindValue(":samplingTime", _plotData->sampleInterval);
    q.bindValue(":minT", _plotData->minTime);
    q.bindValue(":maxT", _plotData->maxTime);

    auto result =q.exec();
    if (result==false)
    {
        QSqlError error = q.lastError();
        qCritical() << QString(__FUNCTION__) << ": Query error:" << error.text();
    }
    qInfo() << __FUNCTION__ << ": " << "Executed query: " << q.numRowsAffected();

    data_series.clear();
    double minY = 1e9, maxY = -1e9;
    while (q.next())
    {
        double t = q.value(0).toDouble();
        double v = q.value(1).toDouble();
        data_series.append(t, v);
        minY = std::min(minY, v);
        maxY = std::max(maxY, v);
    }

    axisY->setRange(minY, maxY);
    axisX->setRange(_plotData->minTime, _plotData->maxTime);
}

void CustomSeriesChart::SelectionChanged(int i)
{
    qInfo() << __FUNCTION__ << ": " << "Series set to [" << i << "]" ;
    Plot();
}

