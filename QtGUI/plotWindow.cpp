#include "plotwindow.h"

#include <QSplitter>
#include <QHeaderView>
#include <QSqlQueryModel>
#include <QFileDialog>
#include <QDebug>
#include <QSqlError>

plotWindow::plotWindow(QWidget *parent)
    : QWidget(parent)
{
    gridLayout = new QGridLayout(this);
    setLayout(gridLayout);

    SetupToolbar();
    SetupRunsTable();    
    SetupCharts();

    if (runsView->model()->rowCount()>0)
    {runsView->selectRow(0);}

    _timer = new QTimer(this);
    connect(_timer, &QTimer::timeout, this, &plotWindow::timerTick);
    _timer->start(5000);
}

plotWindow::~plotWindow()
{
}

void plotWindow::SetupToolbar()
{
    toolbar = new QToolBar(this);
    saveAction = toolbar->addAction("Save");
    closeAction = toolbar->addAction("Close");
    toolbar->addSeparator();

    toolbar->addWidget(new QLabel("X min:"));
    minXBox = new QLineEdit(QString::number(plotData.minTime));

    toolbar->addWidget(minXBox);
    toolbar->addWidget(new QLabel("X max:"));
    maxXBox = new QLineEdit(QString::number(plotData.maxTime));
    toolbar->addWidget(maxXBox);
    updateLimitsAction = toolbar->addAction("Update Limits");

    connect(saveAction, &QAction::triggered, this, &plotWindow::Save);
    connect(closeAction, &QAction::triggered, this, &plotWindow::Close);
    connect(updateLimitsAction, &QAction::triggered, this, &plotWindow::UpdateLimits);

    gridLayout->addWidget(toolbar, 0, 0, 1, 2);
}

void plotWindow::SetupRunsTable()
{
    runsView = new QTableView(this);
    runsView->setSelectionBehavior(QAbstractItemView::SelectRows);
    runsView->setSelectionMode(QAbstractItemView::SingleSelection);
    runsView->horizontalHeader()->setStretchLastSection(true);
    runsView->setMinimumWidth(200);

    gridLayout->addWidget(runsView, 1, 0, 2, 1);

    QSqlQueryModel *model = new QSqlQueryModel(this);
    model->setQuery("SELECT * FROM runs;");

    if (model->lastError().isValid())
    {
        qDebug() << "Query Error:" << model->lastError().text();
    }
    runsView->setModel(model);

    connect(runsView->selectionModel(), &QItemSelectionModel::currentRowChanged,
            this, &plotWindow::RunsSelectionChanged);
}

void plotWindow::SetupCharts()
{
    QWidget *chartsContainer = new QWidget(this);
    QVBoxLayout *chartsLayout = new QVBoxLayout(chartsContainer);

    const int n = 3;
    for (int i=0;i<n;i++)
    {
        CustomSeriesChart* csc = new CustomSeriesChart(&plotData,this);
        csc->setObjectName(QStringLiteral("chartArea_%1").arg(i));
        charts.append(csc);
        chartsLayout->addWidget(csc);
    }

    gridLayout->addWidget(chartsContainer, 1, 1, 2, 1);
}

// ------------------- Toolbar -------------------
void plotWindow::Save()
{
    QString file = QFileDialog::getSaveFileName(this, "Save Chart", "chart.png", "PNG files (*.png)");
    if (file.isEmpty())
        return;  
}

void plotWindow::Close() 
{ 
    this->close(); 
}

void plotWindow::UpdateLimits()
{
    plotData.minTime = minXBox->text().toDouble();
    plotData.maxTime = maxXBox->text().toDouble();
    UpdateCharts();
}

void plotWindow::UpdateCharts()
{
    for (auto c : charts)
    {
        c->Update();
    }
}

// ------------------- Runs table -------------------
void plotWindow::RunsSelectionChanged(const QModelIndex &current, const QModelIndex &previous)
{
    Q_UNUSED(previous);
    if (!current.isValid())
        return;

    int idColumn = 0;
    plotData.runId = current.model()->data(current.sibling(current.row(), idColumn)).toInt();
    UpdateCharts();
}


// ------------------- Timer -------------------
void plotWindow::timerTick()
{
    UpdateCharts();
}
