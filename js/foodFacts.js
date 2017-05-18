$('document').ready(function () {
    createGraph();
    var $rows = $('table');
    var $country = $('#countryTextBox');
    var $sugar = $('#sugarTextBox');
    var $salt = $('#saltTextBox');
    var countryData = "<tr><td>{{country}}</td><td>{{sugar}}</td><td>{{salt}}</td><td><input type='button' class='remove btn btn-danger' id='{{country}}' value='Delete'></td></tr>";

    function addData(data) {
        $rows.append(Mustache.render(countryData, data));
    }
    $.ajax({
        type: 'GET'
        , url: 'http://localhost:3000/data'
        , success: function (data) {
            $.each(data, function (index, element) {
                addData(element);
            });
            
        });
    
    $('#add').on('click', function () {
        let newObject = {
            country: $country.val()
            , sugar: +$salt.val()
            , salt: +$sugar.val()
        }
        $.ajax({
            type: 'POST'
            , url: 'http://localhost:3000/data'
            , ContentType: 'application/json'
            , dataType: 'json'
            , data: newObject
            , success: function (dataOne) {
                $('svg').remove();
                createGraph();
                addData(dataOne);
            }
        });
    });
    $rows.on('click', '.remove', function () {
        $id = this.id;
        let $tr = $(this).closest('tr');
        $.ajax({
            type: 'DELETE'
            , url: 'http://localhost:3000/data/' + $id
            , success: function () {
                $('svg').remove();
                createGraph();
                $tr.remove();
            }
        });
    });
});

function createGraph() {
    var margin = {
            top: 40
            , bottom: 100
            , left: 50
            , right: 90
        }
        , width = 900 - margin.left - margin.right
        , height = 500 - margin.top - margin.bottom;
    var horizontal = d3.scale.ordinal().rangeRoundBands([0, width], 0.15)
        , vertical = d3.scale.linear().rangeRound([height, 0]);
    var color = d3.scale.category10();
    var xAxis = d3.svg.axis().scale(horizontal).orient("bottom");
    var yAxis = d3.svg.axis().scale(vertical).orient("left");
    var svg = d3.select("#graph").append("svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    d3.json("http://localhost:3000/data", function (err, data) {
        if (err) console.log("data not loaded");
        data.forEach(function (d) {
            d.country = d.country;
            d.salt = parseInt(d.salt);
            d.sugar = parseInt(d.sugar);
        });
        var xData = ["sugar", "salt"];
        var dataIntermediate = xData.map(function (c) {
            return data.map(function (d) {
                return {
                    x: d.country
                    , y: d[c]
                };
            });
        });
        var dataStackLayout = d3.layout.stack()(dataIntermediate);
        horizontal.domain(dataStackLayout[0].map(function (d) {
            return d.x;
        }));
        vertical.domain([0, d3.max(dataStackLayout[dataStackLayout.length - 1], function (d) {
                return d.y0 + d.y;
            })
      ]).nice();
        var layer = svg.selectAll(".stack").data(dataStackLayout).enter().append("g").attr("class", "stack").style("fill", function (d, i) {
            return color(i);
        });
        layer.selectAll("rect").data(function (d) {
            return d;
        }).enter().append("rect").attr("x", function (d) {
            return horizontal(d.x);
        }).attr("y", function (d) {
            return vertical(d.y + d.y0);
        }).attr("height", function (d) {
            return vertical(d.y0) - vertical(d.y + d.y0);
        }).attr("width", horizontal.rangeBand());
        svg.append("g").attr("class", "axis").attr("transform", "translate(0," + height + ")").call(xAxis).append("text").attr("transform", "translate(" + width + ",0)").attr("dy", "1.3em").attr("dx", "1.2em").style("font-size", "15px").style("font-weight", "bold").style("color", "red").text("Country");
        svg.append("g").attr("class", "axis").call(yAxis).append("text").attr("transform", "rotate(-90)").attr("dy", "1em").style("text-anchor", "end").style("font-size", "12px").style("font-weight", "bold").style("color", "red").text("Sugar,salt");
        var legend = svg.selectAll(".legend").data(color.domain().slice()).enter().append("g").attr("class", "legend").attr("transform", function (d, i) {
            return "translate(0," + i * 20 + ")";
        });
        legend.append("rect").attr("x", width - 60).attr("width", 18).attr("height", 18).style("fill", color);
        legend.append("text").attr("x", width).attr("y", 9).attr("dy", ".35em").style("text-anchor", "end").style("fill", "green").text(function (d, i) {
            return xData[i];
        });
    });
}