#include "plotwindow.h"

#include <QIcon>
#include <QStyle>

#include <QFileDialog>

#include <QtCharts/QLineSeries>
#include <QtCharts/QLegend>
#include <QtCharts/QBarCategoryAxis>
#include <QtCharts/QValueAxis>

#include <QSqlError>
#include <QSqlQuery>

#include <QString>
#include <QTextStream>
//************************************ public ******************************************

plotWindow::plotWindow(int runId,QWidget *parent)
    :QWidget(parent),
    _runId(runId)
{
    gridLayout = new QGridLayout(this);

    // addWidget(*Widget, row, column, rowspan, colspan)
    // 0th row

    SetupToolbar();
    gridLayout->addWidget(toolbar,0,0,1,3);

    //1st row, plot area
    chart = new QChart();
    chartView = new QChartView(chart,this);
    chartView->chart()->setTheme(QChart::ChartTheme::ChartThemeLight);
    gridLayout->addWidget(chartView, 1, 0,1,3);
    gridLayout->rowMinimumHeight(50);

    this->setLayout(gridLayout);
    this->setWindowTitle("Plot");

    RefreshData(0.1);
}

plotWindow::~plotWindow()
{
    delete chart;
    delete saveAction;
    delete closeAction;
    delete cmbParmas;
}

void plotWindow::AddSeries(QLineSeries* series)
{
    chart->addSeries(series);

    chart->createDefaultAxes();
    QValueAxis *axisY = qobject_cast<QValueAxis*>(chart->axes(Qt::Vertical).first());
    Q_ASSERT(axisY);
    axisY->setLabelFormat("%.1f  ");
}

void plotWindow::SetRunID(int runId)
{
    _runId=runId;
}

//************************************ private ******************************************
void plotWindow::SetupToolbar()
{
    toolbar = new QToolBar(this);

    saveAction = new QAction(QApplication::style()->standardIcon(QStyle::SP_DialogSaveButton),"Save");
    toolbar->addAction(saveAction);
    connect(saveAction, &QAction::triggered, this, &plotWindow::Save);

    closeAction = new QAction(QApplication::style()->standardIcon(QStyle::SP_DialogCloseButton),"Close");
    toolbar->addAction(closeAction);
    connect(closeAction, &QAction::triggered, this, &plotWindow::Close);

    cmbParmas = new QComboBox(this);
    toolbar->addWidget(cmbParmas);
    connect(cmbParmas, &QComboBox::currentTextChanged, this, &plotWindow::ChangeSeries);

    cmbIters = new QComboBox(this);
    toolbar->addWidget(cmbIters);
    connect(cmbIters, &QComboBox::currentTextChanged, this, &plotWindow::ChangeSeries);

    PopulateFields();
}

void plotWindow::PopulateFields()
{
    cmbParmas->clear();
    cmbIters->clear();
    qInfo() << "Attempting to query fields ...\n";

    QSqlQuery query;
    QString outputString;
    QTextStream qs(&outputString);

    qs << "SELECT parameter,COUNT(sim_time) FROM public.events WHERE run_id=" <<
        _runId << " GROUP BY parameter HAVING COUNT(sim_time)>0;";

    query.exec(outputString);

    while (query.next())
    {
        cmbParmas->addItem(query.value(0).toString());
    }

    outputString = "";
    qs << "SELECT iter,COUNT(id) FROM public.events WHERE run_id=" <<
        _runId << " GROUP BY iter HAVING COUNT(id)>0;";

    query.exec(outputString);

    while (query.next())
    {
        cmbIters->addItem(query.value(0).toString());
    }
}

void plotWindow::RefreshData(const double samplingTime)
{
    qInfo() << "Refreshing data ...";
    const QString paramName = cmbParmas->currentText();
    const int iter = cmbIters->currentText().toInt();

    qInfo() << "Param name is : " << paramName;

    _data_series.clear();
    QSqlQuery query;
    QString outputString;
    QTextStream qs(&outputString);

    qs << "SELECT FLOOR(sim_time / " << samplingTime << " ) * " << samplingTime << " AS sim_time_bin, MIN(value) AS x FROM events WHERE sim_time>0.01 AND iter="
       << iter
       << " AND parameter = '"
       << paramName
       << "' GROUP BY sim_time_bin ORDER BY sim_time_bin;";

    query.exec(outputString);

    while (query.next())
    {
        _data_series.append(query.value(0).toDouble(),query.value(1).toDouble());
    }

    qInfo() << "data size is: " << _data_series.count();

    _data_series.setName(paramName);
    QValueAxis *axisY;
    if (chart->series().count()==0)
    {
        chart->addSeries(&_data_series);
        chart->createDefaultAxes();
        axisY = qobject_cast<QValueAxis*>(chart->axes(Qt::Vertical).first());
        Q_ASSERT(axisY);
        axisY->setLabelFormat("%.1f  ");
    }
    else
    {
        axisY = qobject_cast<QValueAxis*>(chart->axes(Qt::Vertical).first());
    }

    //Set limits
    QSqlQuery min_max_query;
    outputString="";
    qs << "SELECT MIN(value) AS MIN_VAL, MAX(value) AS MAX_VAL FROM public.events WHERE sim_time>0.01 AND iter="
       << iter
       <<" AND parameter = '"
       << paramName
       << "';";

    min_max_query.exec(outputString);
    if (min_max_query.next())
    {
        const double minY = min_max_query.value(0).toDouble();
        const double maxY = min_max_query.value(1).toDouble();
        axisY->setMax(maxY);
        axisY->setMin(minY);
        qInfo() << "[Min,Max]: " << minY << "," << maxY;
    }

}
//************************************ slots ******************************************

void plotWindow::Save()
{
    QFileDialog dialog(this);
    dialog.setWindowModality(Qt::WindowModal);
    dialog.setAcceptMode(QFileDialog::AcceptSave);

    if (dialog.exec() == QDialog::Accepted)
    {
        chartView->grab().save((dialog.selectedFiles().first()));
    }
}

void plotWindow::Close()
{
    this->close();
}

void plotWindow::ChangeSeries(const QString &text)
{
    qDebug() << "Selected:" << text;
    if (this->isVisible())
    {
        RefreshData(1);
    }
}

