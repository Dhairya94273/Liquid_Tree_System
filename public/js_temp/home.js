const text = "Smart Liquid Tree System";
let i = 0;

function animateText() {
  if (i < text.length) {
    document.getElementById("animatedText").innerHTML += text.charAt(i);
    i++;
    setTimeout(animateText, 80);
  }
}

animateText();
