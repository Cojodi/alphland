TODO logo
<div align="center">
    <img src="./src/assets/logo-alephium-dark.png" alt="Alephium logo"width=400 alt="alephium-logo" />
    <h4>The home for all dapps in the Alephium ecosystem</h4>

</div>

![Vercel](https://vercelbadge.vercel.app/api/fugashu/alphadapps)

[![Node.js CI](https://github.com/fugashu/alphadapps/actions/workflows/deploy.yml/badge.svg)](https://github.com/fugashu/alphadapps/actions/workflows/deploy.yml)

## 🧭 Explore the Alephium ecosystem

Visit <a href="https://alphad.app"><b>alphad.app</b></a> to explore the most influential dapps in the Alephium ecosystem.

To use them, download the <a href="https://github.com/alephium/desktop-wallet"><b>Alpehium Desktop Wallet</b></a> or use the Alephium Wallet Browser Extension for Chrome or Firefox:

<div align="center">
    <a href="https://chromewebstore.google.com/detail/alephium-extension-wallet/gdokollfhmnbfckbobkdbakhilldkhcj?pli=1">
        <img src="./src/assets/google-chrome-icon.svg" width=50/>
    </a>
    <a href="https://addons.mozilla.org/de/firefox/addon/alephiumextensionwallet/">
        <img src="./src/assets/firefox-browser-icon.svg" width=50/>
    </a>
 
</div>

## ✅ Add your dapp to Alphadapps

If you are building a dapp on Alephium and want to showcase it in Alphadapps, you just need to submit a PR to this repository.

Steps:

1. Create your images: 320x320 logo, 1920x400 banner and 700x400 preview. Use the <a href="https://www.figma.com/community/file/1163928128813560560">Dappland Figma template</a> to help you.
2. Please optimise your images using tinypng.com – JPGs are best for photos and PNGs for graphics. Or you can convert to WebP.
3. Fork this repo and create a new folder with your dapp name under `/public/dapps/`
4. Add your optimised images to the folder
5. Copy `dapp_data_example.json`, rename it with your dapp's name in lowercase and move it to `/data`
6. Fill out the fields in the json file with your dapp's data
7. Ensure the json points to your images, i.e.

```
  "media": {
    "logoUrl": "/dapps/yourdapp/yourdapp-logo.png",
    "bannerUrl": "/dapps/yourdapp/yourdapp-banner.png",
    "previewUrl": "/dapps/yourdapp/yourdapp-preview.png",
    … etc
  }
```

8. Create the PR

And that's it! 🚀

Someone from the Alphadapps team will review the PR and contact you if they need to clarify anything.

For any questions reach out to **Fugashu** on Discord:

<a href="https://discordapp.com/users/Fugashu">
  <img src="https://img.shields.io/badge/Discord-6666FF?style=for-the-badge&logo=discord&logoColor=white">
</a>

<!-- 

TODO 
## 📣 Share your dapp rating with the world

Embed the Dappland rating widget

<img src="https://dv3jj1unlp2jl.cloudfront.net/dappland/widget-rating.svg" alt="Dappland rating widget" />

#### Using the widget

```
<a href="https://www.alphad.app/your_dapp_name" style="display:inline-block;position:relative">
  <div style="position:absolute;top:0;right:0;bottom:0;left:0;"></div>
  <iframe src="https://www.alphad.app/widgets/rating?dappname=your_dapp_name" width="260" height="176" frameBorder="0" title="Dappland Widget"></iframe>
</a>
```

1. Copy and paste the snippet above
2. In `<a href="…">` change `your_dapp_name` to exactly the same as the name of your dapp as shown in your Dappland url.
3. Also change `your_dapp_name` in the `<iframe src="…">`
4. (Optional) you can also set the theme to `theme=light` or `theme=dark` 😎 (default uses the device settings).  
   Just add the `theme` param to the url after your dappname.
5. That's it!

#### Widget example

briq on Dappland is `https://www.alphad.app/briq`, so would be

```
<a href="https://www.alphad.app/briq" style="display:inline-block;position:relative">
  <div style="position:absolute;top:0;right:0;bottom:0;left:0;"></div>
  <iframe src="https://www.alphad.app/widgets/rating?dappname=briq" width="260" height="176" frameBorder="0" title="Dappland Widget"></iframe>
</a>
```
 -->
