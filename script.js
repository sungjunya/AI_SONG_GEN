document.addEventListener("DOMContentLoaded", () => {
    const mainButtons = document.querySelectorAll(".main-btn");
    const subButtons = document.querySelectorAll(".sub-btn");
    const dynamicButtons = document.getElementById("dynamic-buttons");
    const generateBtn = document.querySelector(".generate-btn");

    let mainSelected = null;
    let subSelected = null;

    const dynamicOptions = {
        genre: ["팝", "재즈", "클래식", "힙합", "일렉트로닉"],
        mood: ["Beautiful Music", "아름다운", "친구들", "온화한", "영감을 주는", "평화로운", "Calm Music"],
        activity: ["집중", "미니멀 120", "미니멀 170", "Relax", "Lovely", "명상", "옴", "젠"]
    };

    mainButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            mainButtons.forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
            mainSelected = btn.textContent;
        });
    });

    subButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            subButtons.forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
            subSelected = btn.getAttribute("data-type");

            dynamicButtons.innerHTML = "";
            dynamicOptions[subSelected].forEach(option => {
                const optionBtn = document.createElement("button");
                optionBtn.textContent = option;
                optionBtn.classList.add("dynamic-btn");
                optionBtn.addEventListener("click", () => {
                    optionBtn.classList.toggle("selected");
                });
                dynamicButtons.appendChild(optionBtn);
            });
        });
    });

    generateBtn.addEventListener("click", () => {
        if (mainSelected && subSelected) {
            window.open("result.html", "_blank");
        } else {
            alert("메인 옵션과 하위 옵션을 모두 선택하세요.");
        }
    });
});
