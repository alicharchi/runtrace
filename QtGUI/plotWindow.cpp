#include "plotwindow.h"

#include <QIcon>
#include <QStyle>

#include <QFileDialog>

#include <QtCharts/QLineSeries>
#include <QtCharts/QLegend>
#include <QtCharts/QBarCategoryAxis>

#include <QSqlError>
#include <QSqlQuery>

#include <QString>
#include <QTextStream>

#include <cmath>
//************************************ public ******************************************

plotWindow::plotWindow(int runId,QWidget *parent)
    :QWidget(parent),
    _runId(runId),
    _minX{0},
    _maxX{100}
{
    this->setWindowTitle("Run Monitor");

    gridLayout = new QGridLayout(this);

    SetupToolbar();
    PopulateFields();

    SetupChart();
    this->setLayout(gridLayout);

    RefreshData(0.1);
}

plotWindow::~plotWindow()
{    
}

void plotWindow::SetRunID(int runId)
{
    _runId=runId;
}

//************************************ private ******************************************
void plotWindow::SetupToolbar()
{
    toolbar = new QToolBar(this);

    saveAction = new QAction(QApplication::style()->standardIcon(QStyle::SP_DialogSaveButton),"Save",toolbar);
    toolbar->addAction(saveAction);
    connect(saveAction, &QAction::triggered, this, &plotWindow::Save);

    closeAction = new QAction(QApplication::style()->standardIcon(QStyle::SP_DialogCloseButton),"Close",toolbar);
    toolbar->addAction(closeAction);
    connect(closeAction, &QAction::triggered, this, &plotWindow::Close);

    toolbar->addSeparator();

    QLabel *label1 = new QLabel("  Parameter:", toolbar);
    toolbar->addWidget(label1);

    cmbParmas = new QComboBox(toolbar);
    toolbar->addWidget(cmbParmas);
    connect(cmbParmas, &QComboBox::currentTextChanged, this, &plotWindow::ChangeSeries);

    QLabel *label2 = new QLabel("  Iteration:", toolbar);
    toolbar->addWidget(label2);

    cmbIters = new QComboBox(toolbar);
    toolbar->addWidget(cmbIters);
    connect(cmbIters, &QComboBox::currentTextChanged, this, &plotWindow::ChangeSeries);

    toolbar->addSeparator();

    QLabel *label3 = new QLabel("  min(t):", toolbar);
    toolbar->addWidget(label3);

    QRegularExpression rx(R"([-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?)");
    QRegularExpressionValidator *validator = new QRegularExpressionValidator(rx, toolbar);

    minXBox = new QLineEdit(this);
    minXBox->setText("0.0");
    minXBox->setValidator(validator);
    toolbar->addWidget(minXBox);

    QLabel *label4 = new QLabel("  max(t):", toolbar);
    toolbar->addWidget(label4);

    maxXBox = new QLineEdit(this);
    maxXBox->setText("1000.0");
    maxXBox->setValidator(validator);
    toolbar->addWidget(maxXBox);

    updateLimitsAction = new QAction(QApplication::style()->standardIcon(QStyle::SP_BrowserReload),"Update",toolbar);
    toolbar->addAction(updateLimitsAction);
    connect(updateLimitsAction, &QAction::triggered, this, &plotWindow::UpdateLimits);
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

void plotWindow::SetupChart()
{
    gridLayout->addWidget(toolbar,0,0,1,3);

    chart = new QChart();
    chartView = new QChartView(chart,this);
    chartView->chart()->setTheme(QChart::ChartTheme::ChartThemeLight);
    gridLayout->addWidget(chartView, 1, 0,1,3);
    gridLayout->rowMinimumHeight(50);

    chart->addSeries(&_data_series);

    chart->createDefaultAxes();
    _axisX = qobject_cast<QValueAxis*>(chart->axes(Qt::Horizontal).first());
    Q_ASSERT(_axisX);
    _axisY = qobject_cast<QValueAxis*>(chart->axes(Qt::Vertical).first());
    Q_ASSERT(_axisY);
    _axisY->setLabelFormat("%.1f  ");
}

void plotWindow::RefreshData(const double samplingTime)
{
    qInfo() << "Refreshing data ...";
    const QString paramName = cmbParmas->currentText();
    const int iter = cmbIters->currentText().toInt();

    _axisX->setMin(_minX);
    _axisX->setMax(_maxX);

    qInfo() << "Param name is : " << paramName;

    _data_series.clear();
    QSqlQuery query;
    QString outputString;
    QTextStream qs(&outputString);

    qs << "SELECT FLOOR(sim_time / " << samplingTime << " ) * " << samplingTime << " AS sim_time_bin, MIN(value) AS x FROM events " <<
        "WHERE sim_time>=" << _minX <<
        " AND sim_time<=" << _maxX <<
        " AND iter="
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

    //Set limits
    QSqlQuery min_max_query;
    outputString="";
    qs << "SELECT MIN(value) AS MIN_VAL, MAX(value) AS MAX_VAL,MAX(sim_time) AS MAX_TIME FROM public.events " <<
        "WHERE sim_time>=" << _minX
       << " AND sim_time<=" << _maxX
       << " AND iter="
       << iter
       <<" AND parameter = '"
       << paramName
       << "';";

    min_max_query.exec(outputString);
    if (min_max_query.next())
    {
        const double minY = min_max_query.value(0).toDouble();
        const double maxY = min_max_query.value(1).toDouble();
        _axisY->setMax(maxY);
        _axisY->setMin(minY);
        qInfo() << "[Min,Max]: " << minY << "," << maxY;
    }
    else
    {
        qInfo() << "[Min,Max]: Err";
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

void plotWindow::UpdateLimits()
{
    _minX = minXBox->text().toDouble();
    _maxX = maxXBox->text().toDouble();
}

void plotWindow::ChangeSeries(const QString &text)
{
    qDebug() << "Selected:" << text;
    if (this->isVisible())
    {
        RefreshData(1);
    }
}

