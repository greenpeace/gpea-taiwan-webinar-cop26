const jquery = require('jquery');
$ = window.$ = window.jQuery = jquery;

//var endpoint = 'https://cors-anywhere.small-service.gpeastasia.org/https://cloud.greentw.greenpeace.org/websign-dummy';
var endpoint = 'https://cloud.greentw.greenpeace.org/websign';

var contentUrl = '';
var webinarCampaignId = '7012u000000PAnzAAG';

// collect Form Values
var collectFormValues = () => {
  let dict = {}

  // collect url params
  let searchParams = new URL(window.location.href).searchParams;
  let urlParams2CRMFields = {
    utm_medium: 'UtmMedium',
    utm_source: 'UtmSource',
    utm_campaign: 'UtmCampaign',
    utm_content: 'UtmContent',
    utm_term: 'UtmTerm'
  }
  searchParams.forEach((v, k) => {
    if (k in urlParams2CRMFields) {
      dict[urlParams2CRMFields[k]] = v
    } else {
      dict[k] = v
    }
  });

  // read in the form values
  document.querySelectorAll("#mc-form input,select").forEach(function (el, idx) {
    if (el.type==="checkbox") {
      dict[el.name] = el.checked
    } else {
      dict[el.name] = el.value
    }
  })

  // add extra fields  
  dict['CampaignData1__c'] = searchParams.get('type');
  dict['CampaignData2__c'] = document.querySelector('[name=drawLots]:checked').value;
  dict['CampaignData5__c'] = window.location.href;

  // wrap into FormData
  var formData = new FormData();
  for (var k in dict) {
    //console.log(k, dict[k])
    formData.append(k, dict[k]);
  }

  return formData
}

// Form validation
const formValidate = () => {    
  require('jquery-validation');  

	$.validator.addMethod(
    'email',
    function(value, element){
      return this.optional(element) || /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/i.test(value);
    },
    'Email 格式錯誤'
  );

  $.validator.addMethod(
    'taiwan-phone',
    function (value, element) {
      const phoneReg6 = new RegExp(/^(0|886|\+886)?(9\d{8})$/).test(value);
      const phoneReg7 = new RegExp(/^(0|886|\+886){1}[3-8]-?\d{6,8}$/).test(value);
      const phoneReg8 = new RegExp(/^(0|886|\+886){1}[2]-?\d{8}$/).test(value);
    
      if ($('#MobilePhone').prop('required')) {
        //console.log('phone miss');
        return this.optional(element) || phoneReg6 || phoneReg7 || phoneReg8;
      } else if ($('#MobilePhone').val()) {
        return this.optional(element) || phoneReg6 || phoneReg7 || phoneReg8;
      }
      return true;
    },
    "電話格式不正確，請輸入格式 0912345678 或 02-12345678"
  );

  $.validator.addClassRules({ // connect it to a css class
    "email": {email: true},
    "taiwan-phone" : { "taiwan-phone" : true }
  });  

  $.extend($.validator.messages, {
    required: "必填欄位"
  });
  
  $("#mc-form").validate({    
    submitHandler: function() {
      showFullPageLoading();

      var formData = collectFormValues();              
      
      fetch(endpoint, {
          method: 'POST',
          body: formData
      })
      .then(response => {return response.json()})
      .then(response => {            
        //console.log(response);
        if (response.Status == "201") {              
          // add tracking code here
          sendPetitionTracking('2021-cop_26');                      
        }
        
        $(".form-div").hide();                      
        $(".thank-you-div").show();
        //window.scrollTo(0, 0);
        document.getElementById('thank-you-div').scrollIntoView();
        hideFullPageLoading();    
      })
      .catch(error => {
        console.log(error);
        hideFullPageLoading();
        // display the error message    
        showFullPageMessage("報名失敗，請稍後再嘗試", "#fff", "#66cc00", false);
      }); 
    }
  });
}

/*
 * Mailcheck
 */
let domains = [
	"me.com",
	"outlook.com",
	"netvigator.com",
	"cloud.com",
	"live.hk",
	"msn.com",
	"gmail.com",
	"hotmail.com",
	"ymail.com",
	"yahoo.com",
	"yahoo.com.tw",
	"yahoo.com.hk"
];
let topLevelDomains = ["com", "net", "org"];
let email = document.getElementById("Email");

var Mailcheck = require('mailcheck');
email.onblur = function(){
  //console.log('blur');
	if (!document.getElementById("email-suggestion")) {
		Mailcheck.run({
			email: email.value,
			domains: domains,                       // optional
			topLevelDomains: topLevelDomains,       // optional
			suggested: function(suggestion) {		
				email.insertAdjacentHTML('afterend', `<div id="email-suggestion" style="font-size:small; color:blue; line-height:2rem;">您想輸入的是 <strong id="emailSuggestion">${suggestion.full}</strong> 嗎？</div>`);
				
				document.getElementById("email-suggestion").onclick = function() {
					email.value = document.getElementById("emailSuggestion").innerText;
					document.getElementById("email-suggestion").remove();					
				};
			},
			empty: function() {
				this.emailSuggestion = null;
			}
		});
	}
}

/**
 * This is a full page loading animation	 
 */
const showFullPageLoading = (msg) => {
  if ( !document.querySelector("#page-loading")) {
    if (msg) {
      document.querySelector("body").insertAdjacentHTML('beforeend', `
        <div id="page-loading" class="hide">
          <div class="msg-box">
            <img src="https://change.greenpeace.org.tw/others/gp-logo-green-2019.png" />
          </div>
        </div>`);
    } else {
      document.querySelector("body").insertAdjacentHTML('beforeend', `
        <div id="page-loading" class="hide">
          <div class="lds-ellipsis"><div></div><div></div><div></div><div></div></div>
        </div>`);
    }
  }

  setTimeout(() => { // to enable the transition
    document.querySelector("#page-loading").classList.remove("hide")
  }, 0)
}
/**
 * Hide the full page loading
 */
const hideFullPageLoading = () => {
  document.querySelector("#page-loading").classList.add("hide")

  setTimeout(() => {
    if (document.querySelector("#page-loading")) 
      document.querySelector("#page-loading").remove()
  }, 1100)
}
/**
 * This is a full page message for DD fundraiserId
   */
 const showFullPageMessage = (msg, color, bgcolor, showBtn) => {
  if ( !document.querySelector("#page-message")) {
    var btn = "";
    if (showBtn) {
      btn = `<div><button onclick="$('#page-message').hide();">OK</botton></div>`;
    }

    document.querySelector("body").insertAdjacentHTML('beforeend', `
      <div id="page-message" class="hide">
        <div class="msg-box" style="color:${color}; background-color:${bgcolor}">
          <p>${msg}</p>
          ${btn}
        </div>
      </div>`);
  }

  setTimeout(() => { // to enable the transition
    document.querySelector("#page-message").classList.remove("hide")
  }, 0)
}
/**
 * Hide the full page message
 */
 const hideFullPageMessage = () => {
  document.querySelector("#page-message").classList.add("hide")

  setTimeout(() => {
    document.querySelector("#page-message").remove()
  }, 1100)
}

/**
 * Send Petition Tracking
 */
const sendPetitionTracking = (eventLabel, eventValue) => {
	window.dataLayer = window.dataLayer || [];

	window.dataLayer.push({
	    'event': 'gaEvent',
	    'eventCategory': 'petitions',
	    'eventAction': 'signup',
	    'eventLabel': eventLabel,
	    'eventValue' : eventValue
	});

	window.dataLayer.push({
	    'event': 'fbqEvent',
	    'contentName': eventLabel,
	    'contentCategory': 'Petition Signup'
	});
}

/**
 * Set the target of the webinar: donor / supporter
 */
const setTarget = () => {
  let urlParams = new URLSearchParams(window.location.search);
  let type = urlParams.get('type');

  //set url of app script for sign-up log
  if (type === "donor") {
    //apiUrl = 'https://script.google.com/macros/s/AKfycbw-tVU4LaVVlq4OLYVcIgw6CTldyxNxlzKypAGfiwgNTROvITI3x_USGcVt09bj4-qUgA/exec';
    contentUrl = 'https://gsheet-toolkit.small-service.gpeastasia.org/v1/db/tw-COP26_donor';    
  } else if (type === "supporter") {    
    //apiUrl = 'https://script.google.com/macros/s/AKfycbw0Q-7Jsb_UZ0_AXiLEWtCYDyoNAj1cygBEoXhqX965bFLajFGC0UL7SUrGUAEjTqch/exec';
    contentUrl = 'https://gsheet-toolkit.small-service.gpeastasia.org/v1/db/tw-COP26_supporter';    
    document.querySelector('.drawLots__div').style.display = 'none';
  } else {
    showFullPageMessage("請確認報名網址", "#fff", "#66cc00", false);
  }
}

/**
 * main thread
 */
document.addEventListener("DOMContentLoaded", function(event) { 
  showFullPageLoading(true);

  // Set the target of DD webinar
  setTarget();

  // monitor the status of OptIn
  const OptIn = document.getElementById('OptIn')

  OptIn.addEventListener('change', (event) => {
    if (event.currentTarget.checked) {
      document.querySelector('#OptIn-error').style.display = "none";
      document.querySelector('#submit_btn').disabled = false;
    } else {
      document.querySelector('#OptIn-error').innerHTML = '此部分未打勾將無法收到活動連結通知信，故無法參加活動唷！';
      document.querySelector('#OptIn-error').style.display = "block";
      document.querySelector('#submit_btn').disabled = true;
    }
  })

  // create the year options
	let currYear = new Date().getFullYear();
  let obj = document.getElementById('Birthdate');
  for (var i = 0; i < 100; i++) {
    //let option = `<option value="${currYear-i}-01-01">${currYear-i}</option>`;    
    obj.add(new Option(currYear-i, `${currYear-i}-01-01`));
  }
  //obj.selectedIndex = 21;

  // set campaignId
  document.querySelector('#CampaignId').value = webinarCampaignId;

  // fetch content / image
  fetch(contentUrl).then(function(response) {
      // response.json() returns a promise, use the same .then syntax to work with the results
      response.json().then(function(jsonObj) {
        //console.log(jsonObj.records[0]);
        document.getElementsByClassName("img-div")[0].innerHTML = jsonObj.records[0].Image;
        document.title = jsonObj.records[0].Title;
        document.getElementsByClassName("title")[0].innerHTML = jsonObj.records[0].Title;
        document.getElementsByClassName("title")[1].innerHTML = jsonObj.records[0].Title;
        document.getElementsByClassName("content-top")[0].innerHTML = jsonObj.records[0].ContentTop;
        document.getElementsByClassName("content-bottom")[0].innerHTML = jsonObj.records[0].ContentBottom;
        document.getElementsByClassName("content")[0].innerHTML = jsonObj.records[0].ThankYouMessage;

        hideFullPageLoading();
      });
  }).catch(err => console.error(err)); 

  //let maxSignups = 0;
  fetch("https://gsheet-toolkit.small-service.gpeastasia.org/v1/db/tw-COP26_setting")
    .then(response =>  response.json())
    .then(function(jsonObj) {            
      return jsonObj.records[0].MaxSignups;      
    })
    .then(maxSignups => {      
      return fetch("https://cloud.greentw.greenpeace.org/campaign-member-counts")  
        .then(response => response.json())
        .then(response => {      
          let rows = response;
          
          rows.forEach(serverRow => {
            let campaignId = serverRow["Id"];
            
            // find this campaign        
            if (campaignId === webinarCampaignId) {
              let numRes = parseInt(serverRow["NumberOfResponses"], 10);              
              if (numRes >= maxSignups) {
                console.log('報名人數已滿' + numRes);
                showFullPageMessage("報名人數已滿", "#fff", "#66cc00", false);
              } else {
                console.log('歡迎報名 ' + numRes);
              }              
            }
          });
        });  
    })
    .catch(err => console.error(err)); 
  
  formValidate();
});