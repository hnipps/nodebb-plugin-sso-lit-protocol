"use strict";

const LitJsSdk = require("lit-js-sdk");
const Cookies = require("js-cookie");
const { v4: uuidv4 } = require("uuid");

/* globals document, web3, $ */

const accessControlConditions = [
  {
    contractAddress: "",
    standardContractType: "",
    chain: "ethereum",
    method: "",
    parameters: [":userAddress"],
    returnValueTest: {
      comparator: "=",
      value: "0xD02bf9b3DA78BEc791014EB3cEecA65990cb046F",
    },
  },
  { operator: "or" },
  {
    contractAddress: "",
    standardContractType: "",
    chain: "ethereum",
    method: "",
    parameters: [":userAddress"],
    returnValueTest: {
      comparator: "=",
      value: "0x50e2dac5e78B5905CB09495547452cEE64426bb2",
    },
  },
];

const id = uuidv4();

async function connect() {
  const resourceId = {
    baseUrl: "http://localhost:4000",
    path: "/protected",
    orgId: "",
    role: "",
    extraData: id,
  };

  const client = new LitJsSdk.LitNodeClient({ alertWhenUnauthorized: false });
  await client.connect();
  const authSig = await LitJsSdk.checkAndSignAuthMessage({
    chain: "ethereum",
  });

  await client.saveSigningCondition({
    accessControlConditions,
    chain: "ethereum",
    authSig,
    resourceId,
  });
  try {
    const jwt = await client.getSignedToken({
      accessControlConditions,
      chain: "ethereum",
      authSig,
      resourceId: resourceId,
    });
    Cookies.set("lit-auth", jwt, { expires: 1 });
  } catch (err) {
    console.log("error: ", err);
  }
}

$(document).ready(() => {
  const showWelcomeMessage = () => {
    if (ajaxify.data.template.name.startsWith("account")) {
      return;
    }

    $("#user_label")
      .popover({
        content: `<p>Welcome, <strong>${app.user.username}</strong>!</p> <p>Click me to edit your profile. Please confirm your email address to fully activate your account.</p>`,
        placement: "bottom",
        trigger: "focus",
        viewport: "#content",
        html: true,
      })
      .popover("show");

    $("window, #user_label").one("click", function () {
      $("#user_label").popover("destroy");
    });
  };

  const deauthenticate = () => {
    fetch(`${config.relative_path}/deauth/lit-protocol`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": config.csrf_token,
      },
    })
      .then(() => {
        ajaxify.go(`${config.relative_path}/me/edit`);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const authenticate = async () => {
    await connect();
    const jwt = Cookies.get("lit-auth");
    try {
      const response = await fetch(
        `${config.relative_path}/auth/lit-protocol`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": config.csrf_token,
          },
          body: JSON.stringify({
            jwt,
            baseUrl: "http://localhost:4000",
            path: "/protected",
            extraData: id,
          }),
        }
      );

      if (ajaxify.data.template.name === "account/edit") {
        ajaxify.go(`${config.relative_path}/me/edit`);
      } else {
        ajaxify.go("/");
        // BUG
        // page reloads before going to "/"
        // was working previously without timeout
        setTimeout(function () {
          window.location.reload();
        }, 500);
      }
    } catch (error) {
      console.error("Something went wrong while signing in...", error);
    }
  };

  if (config.uid && config.requireEmailConfirmation && !app.user.email) {
    showWelcomeMessage();
  }

  // only prompt web3 login when user requests to do so
  if (
    !config.uid &&
    window.ethereum &&
    window.location.href.includes("/auth/lit-protocol")
  ) {
    authenticate();
  }

  $(window).on("action:ajaxify.end", () => {
    if (ajaxify.data.template.name === "account/edit") {
      $('[data-component="web3/associate"]').on("click", authenticate);
      $('[data-component="web3/disassociate"]').on("click", deauthenticate);
    }
  });
});
