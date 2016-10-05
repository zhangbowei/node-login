$(document).ready(function () {
    var dataGrid = null,
        gridDiv = null,
        workbook = null,
        chart = null;

    $('#statistic').hide();

    gridDiv = document.createElement('div');
    gridDiv.classList.add('grid');
    
    dataGrid = new wijmo.grid.FlexGrid(gridDiv);
    chart = new wijmo.chart.FlexChart('#chart');

    var parseFile = function(e) {
        e.preventDefault();

        var file = e.target.files ? e.target.files[0] : e.dataTransfer.files[0];
        var fileName = file.name.substring(file.name.lastIndexOf(".")+1).toLowerCase();
        if(fileName !="xls" && fileName !="xlsx"){
          alert("请选择excel格式文件上传！");
          return;
        }
        
        //onload belong to async, so every times need use file, has to read it again.
        //or not file maybe NULL.
        notifyFileName(file);
        showFileStatistic(file);
        handleDrop(file);

        target.appendChild(gridDiv);
        dataGrid.onCellEditEnded = function (e) {
            target.refresh(false);
        }
    };

    var target = document.querySelector('#target');

    target.addEventListener('dragenter', function (e) {
        e.preventDefault();
        this.classList.remove('hover');

    });
    target.addEventListener('dragleave', function (e) {
        e.preventDefault();
        this.classList.add('hover');
    });
    target.addEventListener('dragover', function (e) {
        e.preventDefault();
        this.classList.remove('hover');
    });
    //Need behind the definition of "parseFile" 
    target.addEventListener('drop', parseFile);

    fileInput = document.createElement('input');
    fileInput.type = "file";
    fileInput.onchange = function(e) {
        parseFile(e);
    }

    $('#choose').click(function(e){
        e.preventDefault();
        fileInput.click(e);
    });

    document.querySelector('#export').addEventListener('click', function () {
        if (dataGrid) {
            exportExcel('file');
        }
        return false;
    });

    document.querySelector('#excel-form-btn').addEventListener('click', function () {
        if (dataGrid) {
            $('#excel-tf')[0].value = JSON.stringify(dataGrid.collectionView.items);
        }
        return false;
    });

    document.querySelector('#toggle_chart_type').addEventListener('click', function () {
        if (chart) {
            chart.chartType = chart.chartType === wijmo.chart.ChartType.Column ?
                wijmo.chart.ChartType.Area :
                wijmo.chart.ChartType.Column;
        }
    });

    var notifyFileName = function(file) {
        var name;
        if (file) {
            name = file.name;
            $('#notify').html(name + " has been chosen");
        } else {
            $('#notify').html("No file chosen");
        }
    }

    var showFileStatistic = function(file) {
        if (file) {
            $('#statistic').show();
        } else {
            $('#statistic').hide();
        }
    };

    var initChartConfigure = function(collection) {
        var configure = {};
        var collectionView = new wijmo.collections.CollectionView(collection);

        configure.itemsSource = collectionView;
        configure.options = { groupWidth: 15 };

        var item = collection[0];
        var nameSet, nameX, nameY=[], num;
        nameSet = Object.keys(item);
        nameX = (nameSet.indexOf("name")!=-1) ? "name" : nameSet.shift();
        for (var key in nameSet) {
            num = item[nameSet[key]];
            if (num > 2 && num < 500) {
                nameY.push({name: nameSet[key], binding: nameSet[key]});
            }
        }

        configure.bindingX = nameX; 
        configure.series = nameY;

        return configure;
    };

    var handleDrop = function (file) {
        var reader;
        var workbook;
        if (file) {
            reader = new FileReader;
           
            reader.onload = function (e) {
                workbook = new wijmo.xlsx.Workbook();
                workbook.load(reader.result);
                var collection = getCollectionView(workbook);
                var collectionView = new wijmo.collections.CollectionView(collection);
                dataGrid.itemsSource = collectionView;

                //some bug in wijmo.js, so there init series manually
                chart.series = [chart.series.shift()];

                chart.initialize(initChartConfigure(collection));
            };
            reader.readAsDataURL(file);
        }
    }

    var getCollectionView = function (workbook) {
        var collectionView = [];
        if (workbook) {
            var sheet = workbook.sheets[0];
            var header = [];
            for (var i = 0, length = sheet.rows.length; i < length; i++) {

                var row = sheet.rows[i];
                var rowArray = {};
                for (var j = 0, jLength = row.cells.length; j < jLength; j++) {
                    var cell = row.cells[j];
                    if (i === 0) {
                        header.push(cell.value);
                    }
                    else {
                        rowArray[header[j]] = cell.value;
                    }
                }
                if (i !== 0) {
                    collectionView.push(rowArray);
                }
            }
        }
        return collectionView;
    }

    var exportExcel = function (fileName) {
        wijmo.grid.xlsx.FlexGridXlsxConverter.save(dataGrid,
            { includeColumnHeaders: true }, fileName);

    }

    var ec = new ExcelController();
    var ev = new ExcelValidator();

    $('#excel-form').ajaxForm({
        beforeSubmit: function (formData, jqForm, options) {
            if (ev.validateForm() == false) {
                return false;
            } else {
                formData.push({ name: 'user', value: $('#userId').val() });
                formData.push({ name: 'excel', value: $('#excel-tf').val() });
                return true;
            }
        },
        success: function (responseText, status, xhr, $form) {
            if (status == 'success') ec.onUpdateSuccess();
        },
        error: function (e) {
            if (e.responseText == 'error-updating-excel') {
                ev.showInvalidExcel();
            }
        }
    });

});