/**
 * Created by marc on 18/01/16.
 */
function myClick(e){
    alert("SUBIGAY");
}

var title = document.querySelector("h1");
title.style.color = "red";

button = document.querySelector("button");
button.addEventListener("Click", myClick);