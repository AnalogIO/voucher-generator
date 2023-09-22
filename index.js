const API_BASE = "https://core.prd.analogio.dk";
const authToken = localStorage.getItem("authToken");

async function fetchFromAPI(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            "Authorization": `Bearer ${authToken}`,
            "Content-Type": "application/json",
            ...options.headers
        }
    });
    if (!response.ok) throw new Error(await response.text());
    return await response.json();
}

document.getElementById("voucherForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    await generateVoucherCodes();
});

async function generateVoucherCodes() {
    const voucherPrefix = document.getElementById("voucherPrefix").value;
    const description = document.getElementById("description").value;
    const requester = `${document.getElementById("requester").value} (via Voucher Generator)`;
    const tableRows = document.querySelectorAll("#products tbody tr");
    let issuedVouchers = {};

    for (const row of tableRows) {
        const [amountCell, nameCell, idCell] = row.cells;
        const amount = amountCell.querySelector('input').value;
        const name = nameCell.textContent;
        const id = idCell.textContent;

        if (amount <= 0) continue;

        const payload = {
            ProductId: parseInt(id),
            Amount: parseInt(amount),
            VoucherPrefix: voucherPrefix,
            Description: description,
            Requester: requester
        };

        try {
            const data = await fetchFromAPI("/api/v2/vouchers/issue-vouchers", {
                method: "POST",
                body: JSON.stringify(payload)
            });
            issuedVouchers[name] = data;
        } catch (error) {
            console.error(`Failed to issue vouchers for ${name}: ${error}`);
            alert(`Failed to issue vouchers for ${name}: ${error}`);
        }
    }

    displayGeneratedVouchers(issuedVouchers);
}

function displayGeneratedVouchers(issuedVouchers) {
    let outputHTML = "<h2>Issued Vouchers:</h2>";
    for (const [productName, vouchers] of Object.entries(issuedVouchers)) {
        outputHTML += `<h3>${productName} vouchers:</h3><pre><code>`;
        vouchers.forEach(({ voucherCode }) => {
            outputHTML += `${voucherCode}\n`;
        });
        outputHTML += "</code></pre>";
    }
    document.getElementById("issuedVouchers").innerHTML = outputHTML;
}

(async () => {
    try {
        const userInfo = await fetchFromAPI("/api/v2/account");
        document.getElementById("content").innerHTML = `<p>Hi ${userInfo.name} (${userInfo.email})</p>`;
        document.getElementById("voucherForm").removeAttribute("hidden");
    } catch (error) {
        console.error(error);
        alert(error);
        document.getElementById("content").innerHTML = `<p>${error} <a href="login.html">Login</a></p>`;
    }
})();