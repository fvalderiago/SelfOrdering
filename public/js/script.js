// nav toggler

let navToggler = document.querySelector('.nav-toggler');
let linksContainer = document.querySelector('.links-container');

navToggler.addEventListener('click', () => {
    navToggler.classList.toggle('active');
    linksContainer.classList.toggle('active');
})

// about us review slider

let reviews = document.querySelectorAll('.review-wrapper');

let currentReviews = [0, 2];

let updateReviewSlider = (cards) => {

    cards.forEach((card_index) => {
        reviews[card_index].classList.add('active');
    });
}

setInterval(() => {
    currentReviews.forEach((card_index, i) => {
        reviews[card_index].classList.remove('active');
        currentReviews[i] = card_index >= reviews.length - 1 ? 0 : card_index + 1;
    })

    setTimeout(() => {
        updateReviewSlider(currentReviews);
    }, 250);

}, 5000)

updateReviewSlider(currentReviews)

// faq

let faqs =  [...document.querySelectorAll('.faq')];

faqs.map(faq => {
    let ques = faq.querySelector('.question-box');

    ques.addEventListener('click', () => {
        faq.classList.toggle('active');
    })
})

// dish slider

let dishSlider = document.querySelector('.dish-slide');

let rotationVal = 0;

setInterval(() => {
    rotationVal += 120;
    dishSlider.style.transform = `translateY(-50%) rotate(${rotationVal}deg)`
}, 3000)

AOS.init();

//user profile
//   const toggleBtn = document.getElementById("profile-toggle");
//   const panel = document.getElementById("profile-panel");
//   const overlay = document.getElementById("overlay");
//   const closeBtn = document.getElementById("close-profile");

//   toggleBtn.addEventListener("click", function (e) {
//     e.preventDefault();
//     panel.classList.toggle("active");
//     overlay.style.display = panel.classList.contains("active") ? "block" : "none";
//   });

//   closeBtn.addEventListener("click", function () {
//     panel.classList.remove("active");
//     overlay.style.display = "none";
//   });

//   overlay.addEventListener("click", () => {
//     panel.classList.remove("active");
//     overlay.style.display = "none";
//   });


const toggleBtn = document.getElementById("profile-toggle");
const panel = document.getElementById("profile-panel");
const overlay = document.getElementById("overlay");
const closeBtn = document.getElementById("close-profile");

if (toggleBtn && panel && overlay && closeBtn) {
  toggleBtn.addEventListener("click", function (e) {
    e.preventDefault();
    panel.classList.toggle("active");
    overlay.style.display = panel.classList.contains("active") ? "block" : "none";
  });

  closeBtn.addEventListener("click", function () {
    panel.classList.remove("active");
    overlay.style.display = "none";
  });

  overlay.addEventListener("click", () => {
    panel.classList.remove("active");
    overlay.style.display = "none";
  });
}