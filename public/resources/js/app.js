const country_name_element = document.querySelector(".country .name");
const total_cases_element = document.querySelector(".total-cases .value");
const new_cases_element = document.querySelector(".total-cases .new-value");
const recovered_element = document.querySelector(".recovered .value");
const new_recovered_element = document.querySelector(".recovered .new-value");
const deaths_element = document.querySelector(".deaths .value");
const new_deaths_element = document.querySelector(".deaths .new-value");

var con=firebase.database().ref("Corona/User").push({val:"user"});
con.onDisconnect().remove();

let app_data = [],
  cases_list = [],
  recovered_list = [],
  deaths_list = [],
  deaths = [],
  formatedDates = [],
  last_14_days=[],
  last_14_cases=[],
  last_14_death=[],
  last_14_recovered=[]
  selected_data=[]
  selected_color="#FFF",
  selected_label="Active cases"

let country="India";

function fetchData() {
  country = "India";
  country_name_element.innerHTML = "Loading...";

  (cases_list = []),
    (recovered_list = []),
    (deaths_list = []),
    (dates = []),
    (formatedDates = []);

  var requestOptions = {
    method: "GET",
    redirect: "follow"
  };

  const api_fetch = async (country) => {
    await fetch(
      "https://api.covid19api.com/total/country/" +
        country +
        "/status/confirmed",
      requestOptions
    )
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        data.forEach((entry) => {
          dates.push(entry.Date);
          cases_list.push(entry.Cases);
        });
        firebase.database().ref("Corona/data/dates").set(dates);
        firebase.database().ref("Corona/data/cases").set(cases_list);
      }).catch((e)=>{
        console.log("Error : "+e);
        firebase.database().ref("Corona/data/").once('value',(snapshot)=>{
          var data=snapshot.val();
          dates=data.dates;
          cases_list=data.cases;
          recovered_list=data.recovered;
          deaths_list=data.death;
          updateUI();
        });
      });

    await fetch(
      "https://api.covid19api.com/total/country/" +
        country +
        "/status/recovered",
      requestOptions
    )
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        data.forEach((entry) => {
          recovered_list.push(entry.Cases);
        });
        firebase.database().ref("Corona/data/recovered").set(recovered_list);
      }).catch((e)=>{
        console.log("Error : "+e);
      });

    await fetch(
      "https://api.covid19api.com/total/country/" + country + "/status/deaths",
      requestOptions
    )
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        data.forEach((entry) => {
          deaths_list.push(entry.Cases);
        });
        firebase.database().ref("Corona/data/death").set(deaths_list);
      }).catch((e)=>{
        console.log("Error : "+e);
      });
    updateUI();
  };

  api_fetch(country);
}

fetchData(country);

// UPDATE UI FUNCTION
function updateUI() {
  updateStats();
  axesLinearChart();
  last_14_bar_chart();

}

function updateStats() {

 

  const total_cases = cases_list[cases_list.length - 1];
  const total_recovered = recovered_list[recovered_list.length - 1];
  const total_deaths = deaths_list[deaths_list.length - 1];
  
  country_name_element.innerHTML = country +" till now...";
  total_cases_element.innerHTML = total_cases;
  recovered_element.innerHTML = total_recovered;
  deaths_element.innerHTML = total_deaths;

  // format dates
  
  dates.forEach((date) => {

    formatedDates.push(formatDate(date));
  });

  // getting last 14 days 
  
  var len_f_dates=formatedDates.length;
  
  last_14_days=formatedDates.slice(len_f_dates-14,len_f_dates);
  // console.log(last_14_days);
  last_14_cases=cases_list.slice(len_f_dates-14,len_f_dates); // dates and cases_list have same size , from api call result
  last_14_recovered=recovered_list.slice(len_f_dates-14,len_f_dates);
  last_14_death=deaths_list.slice(len_f_dates-14,len_f_dates);
  //--
  last_14_cases=get_vals_(cases_list);
  last_14_recovered=get_vals_(recovered_list);
  last_14_death=get_vals_(deaths_list);

  selected_data=last_14_cases;

  var last_date=dates.length-1;
  var total=deaths_list[last_date]+cases_list[last_date]+recovered_list[last_date]
            -(deaths_list[last_date-1]+cases_list[last_date-1]+recovered_list[last_date-1]);
  new Chart(document.getElementById("donut_chart"),
    {
      "type":"doughnut",
      "data":
      {
        "labels":["Deaths","New cases","Recovered"],
        "datasets":[
          {
            label:"Today - Latest Update ",
            borderWidth:0,
            data:[deaths_list[last_date]-deaths_list[last_date-1],cases_list[last_date]-cases_list[last_date-1],recovered_list[last_date]-recovered_list[last_date-1]],
            backgroundColor:["#f00","#00f","#0f0"]
          }
        ]
      }
    });
}

function get_vals_(last14)
{
  var ar=[];
  for(var i=last14.length-14;i<last14.length;i++){
    ar.push(last14[i]-last14[i-1]);
  }
  return ar;
}
// UPDATE CHART
let my_chart;
function axesLinearChart() {
  if (my_chart) {
    my_chart.destroy();
  }
  document.getElementById("latest").innerHTML=formatDate(dates[dates.length-1])+ " - Latest Update";
  var ctx=document.getElementById("chart");
  my_chart = new Chart(ctx, {
    type: "line",
    data: {
      datasets: [
        {
          label: "Cases",
          data: cases_list,
          fill: false,
          borderColor: "#FFF",
          backgroundColor: "#FFF",
          borderWidth: 1,
        },
        {
          label: "Recovered",
          data: recovered_list,
          fill: false,
          borderColor: "#009688",
          backgroundColor: "#009688",
          borderWidth: 1,
        },
        {
          label: "Deaths",
          data: deaths_list,
          fill: false,
          borderColor: "#f44336",
          backgroundColor: "#f44336",
          borderWidth: 1,
        },
      ],
      labels: formatedDates,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}


// LAST 14 DAYS CHART DATA
let last_14_chart_cases;
function last_14_bar_chart() {
  
  if (last_14_chart_cases) {
    last_14_chart_cases.destroy();
  }
  var ctx=document.getElementById("chart_second");
  last_14_chart_cases = new Chart(ctx, {
    type: "bar",
    data: {
      datasets: [
        {
          label: selected_label,
          data: selected_data,
          fill: false,
          borderColor: selected_color,
          backgroundColor: selected_color,
          borderWidth: 1,
        },
        
      ],
      labels: last_14_days,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}




// FORMAT DATES
const monthsNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatDate(dateString) {
  let date = new Date(dateString);
  return `${date.getDate()} ${monthsNames[date.getMonth()]}`;
}



// scripts for navigation selection in charts

var nav = $("nav");
var line = $("<div />").addClass("line");

line.appendTo(nav);

var active = nav.find(".active");
var pos = 0;
var wid = 0;

if (active.length) {
  pos = active.position().left;
  wid = active.width();
  line.css({
    left: pos,
    width: wid
  });
}

nav.find("ul li a").click(function (e) {
  e.preventDefault();
  if (!$(this).parent().hasClass("active") && !nav.hasClass("animate")) {
    nav.addClass("animate");

    var _this = $(this);

    nav.find("ul li").removeClass("active");

    var position = _this.parent().position();
    var width = _this.parent().width();

    if (position.left >= pos) {
      line.animate(
        {
          width: position.left - pos + width
        },
        300,
        function () {
          line.animate(
            {
              width: width,
              left: position.left
            },
            150,
            function () {
              nav.removeClass("animate");
            }
          );
          _this.parent().addClass("active");
        }
      );
    } else {
      line.animate(
        {
          left: position.left,
          width: pos - position.left + wid
        },
        300,
        function () {
          line.animate(
            {
              width: width
            },
            150,
            function () {
              nav.removeClass("animate");
            }
          );
          _this.parent().addClass("active");
        }
      );
    }

    pos = position.left;
    wid = width;
  }
});


// click functions for nav bar
document.getElementById("cases_tab").onclick=function(){

  selected_data=last_14_cases;
  selected_color="#FFF";
  selected_label="Active cases";
  last_14_bar_chart();
};

document.getElementById("recovered_tab").onclick=function(){

  selected_data=last_14_recovered;
  selected_color="#009688";
  selected_label="Recovered";

  last_14_bar_chart();
};

document.getElementById("dead_tab").onclick=function(){

  selected_data=last_14_death;
  selected_color="#f44336";
  selected_label="Deaths";
  last_14_bar_chart();
};