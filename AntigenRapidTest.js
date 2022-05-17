const InfoContainer = document.querySelector(".info-container");
const citySelector = document.querySelector(".city-selector");
const BtnEnter = document.querySelector(".BtnEnter");
const TablePanel = document.querySelector(".TablePanel");
const MapID = document.querySelector("#map")
let table = document.querySelector("table");

let stores = []; //放入全國販賣快篩試劑的店名

function createStoreInformation(storeArray) {
  storeArray.forEach((event) => {
    const singleKey = event.split(",");
    let store = {
      ID: singleKey[0],
      Name: singleKey[1],
      Address: singleKey[2],
      Lon: singleKey[3],
      Lat: singleKey[4],
      phone: singleKey[5],
      brand: singleKey[6],
      amount: singleKey[7],
      Time: singleKey[8],
      Note: singleKey[9]
    };
    stores.push(store);
  });
  stores.pop(); //疑似最後還有一行空白的
  stores.shift(); //把表頭移除
  console.log(stores);
}

// 套件:tw-city-selector
//https://dennykuo.github.io/tw-city-selector/#/
new TwCitySelector({
  el: ".city-selector",
  elCounty: ".county", // 在 el 裡查找 element
  elDistrict: ".district", // 在 el 裡查找 element
  elBtn: ".BtnEnter",
  el: ".city-selector-standard-words",
  standardWords: true
  // countyValue: "臺北市" // 此處需用正體字的臺
});

//下拉式清單選完後，列出縣市及區域皆符合的藥局
//我現在抓到的好像是試劑剩餘數量還有的藥局，若剩餘數量為0的店我猜是不會出現在健保署的清單上?
function FindLocation(AddressInput) {
  let searchStore = []; //放入下拉式清單選擇後的店名
  const county = citySelector.firstElementChild.value;
  const District = citySelector.firstElementChild.nextElementSibling.value;
  //將地址拿來跟county&District做比較
  stores.forEach((event) => {
    for (let key in event) {
      if (key === "Address") {
        if (event[key].includes(county) && event[key].includes(District)) {
          searchStore.push(event);
        }
      }
    }
  });
  return searchStore;
}

function createStoreTable(Results) {
  Results.forEach((event) => {
    let tbody = document.createElement("tbody"); //要一直create，否則只會出現一間店
    let StoreTable = "";
    StoreTable += `
            <tr>
            <td rowspan="2">${event["Name"]}</td>
            <td rowspan="2">${event["amount"]}</td>
            <td>${event["Address"]}</td>           
            <td rowspan="2">${event["phone"]}</td>  
            <td rowspan="2"><button class="GoogleMapModal" data-bs-toggle="modal" data-bs-target="#map-Modal" data-id="${event["ID"]}">click</button></td>
            </tr>
            <tr><td class="note">備註:${event["Note"]}</td></tr>
    `;
    tbody.innerHTML = StoreTable;
    tbody.setAttribute("id", `${event["ID"]}`);
    table.appendChild(tbody);
  });
}

function SearchStoreList(event) {
  const target = event.target;
  const SelectCounty = document.querySelector(".SelectCounty").value;
  const SelectDistrict = document.querySelector(".SelectDistrict").value;

  if (SelectCounty.length === 0 || SelectDistrict.length === 0) {
    return;//沒有輸入縣市地區的話，按鈕不可有反應
  } else {
    //檢查table中有沒有tbody表格?有的話先刪掉，不然每按一次button都會再append新搜尋結果到table上去
    if (table.lastElementChild.tagName === "TBODY") {
      const tbody = document.querySelectorAll("tbody");
      tbody.forEach((event) => {
        event.remove();
      });
    }
    //檢查:如果之前顯示"沒有庫存資訊"的話，先把那句話刪掉
    if(TablePanel.lastElementChild.tagName === "H2"){
      const noInfo=document.querySelector(".noInfo")
      noInfo.remove()
    }
    
    const initial = InfoContainer.firstElementChild.nextElementSibling.nextElementSibling
    if (initial.classList.value.includes("initialize")) {
      initial.remove()
    }

    if (FindLocation().length === 0) {
      let h2 = document.createElement('h2')
      h2.innerHTML = "目前沒有庫存資訊"
      h2.classList.add("noInfo")
      TablePanel.appendChild(h2)
    } else {
      createStoreTable(FindLocation());
    }
  }
}

function openModal(event) {
  const target = event.target;
  if (target.matches(".GoogleMapModal")) {
    const mapModalTitle = document.querySelector("#map-modal-title");
    const mapModalContent = document.querySelector("#map-modal-content");
    const brandName = document.querySelector(".brand-name");
    const showAddress = document.querySelector(".showAddress");
    const getID = target.parentElement.parentElement.parentElement;
    const Store_id = Number(getID.id); //getID.id得到ID那串數字，但為string type
    const stores = FindLocation();

    stores.forEach((event) => {
      for (let key in event) {
        if (key === "ID") {
          if (event[key] === getID.id) {
            mapModalTitle.innerHTML = event.Name;
            brandName.innerHTML = event.brand;
            showAddress.innerHTML = event.Address
            initMap(event)
            
          }
        }
      }
    });
    console.log(Store_id);
  }
}

function initMap(position) {
  let map;
  let latlng = { lat: 25.046891, lng: 121.516602 }
  map = new google.maps.Map(MapID, {
    center: latlng,
    zoom: 15,
  });

  let pos = {
    lat: Number(position.Lat),
    lng: Number(position.Lon)
  }
  map.setCenter(pos)
  const marker = new google.maps.Marker({
    position: { lat: Number(position.Lat), lng: Number(position.Lon) },
    map: map,
  });
  // container.initMap = map;
}


// 輸入縣市及區域後，查詢
BtnEnter.addEventListener("click", SearchStoreList);
//打開Modal看地圖
TablePanel.addEventListener("click", openModal);

axios
  .get("https://data.nhi.gov.tw/resource/Nhi_Fst/Fstdata.csv")
  .then((response) => {
    const result = response.data;
    // 解析CSV檔案，將其改組成Array(全部的店)，Array裡包Object(各店資訊)
    const NewStoreArray = result.split("\r\n");
    createStoreInformation(NewStoreArray);
  })
  .catch((error) => console.log(error));
