const text = "Data Scientist | AI Enthusiast";

let index = 0;

function typeEffect() {

    const typing = document.getElementById("typing");

    if(index < text.length){
        typing.innerHTML += text.charAt(index);
        index++;
        setTimeout(typeEffect, 100);
    }
}

window.onload = typeEffect;


// NAVBAR EFFECT

window.addEventListener("scroll", () => {

    const navbar = document.querySelector(".navbar");

    if(window.scrollY > 50){
        navbar.classList.add("scrolled");
    }
    else{
        navbar.classList.remove("scrolled");
    }

});