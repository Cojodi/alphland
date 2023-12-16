<div align="center">
    <img src="src/assets/logo-alphland-light.svg" alt="Alphland logo" width=400 />
    <h4>The home for all dapps in the Alephium ecosystem</h4>

</div>

![Vercel CI](https://vercelbadge.vercel.app/api/cojodi/Alphland)

## 🧭 Explore the Alephium ecosystem

Visit <a href="https://alph.land"><b>alph.land</b></a> to explore the most influential dapps in the Alephium
ecosystem.

To use them, download the <a href="https://github.com/alephium/desktop-wallet"><b>Alephium Desktop Wallet</b></a> or use
the Alephium Wallet Browser Extension for Chrome or Firefox:

<div align="center">
    <a href="https://chromewebstore.google.com/detail/alephium-extension-wallet/gdokollfhmnbfckbobkdbakhilldkhcj?pli=1">
        <img src="./src/assets/google-chrome-icon.svg" width=50/>
    </a>
    <a href="https://addons.mozilla.org/de/firefox/addon/alephiumextensionwallet/">
        <img src="./src/assets/firefox-browser-icon.svg" width=50/>
    </a>
</div>

## ✅ Add your dapp to Alphland

If you are building a dapp on Alephium and want to showcase it in Alphland, you just need to submit a PR to this
repository.

Steps:

1. Create your images: 320x320 logo, 1920x400 banner and 700x400 preview. Use
   the <a href="https://www.figma.com/file/6S69MxzfC99Sn6VxhqVuYL/Alphland-Figma-Template?type=design&node-id=0-1&mode=design&t=9k544zGf8bbibA5E-0">
   Alphland Figma template</a> to help you.
2. Please optimise your images using tinypng.com – JPGs are best for photos and PNGs for graphics. Or you can convert to
   WebP.
3. Fork this repo and create a new folder with your dapp name under `/public/dapps/`
4. Add your optimised images to the folder
5. Copy [`dapp_data_example.json`](https://github.com/Cojodi/alphland/blob/develop/dapp_data_example.json), rename it
   with your dapp's name in lowercase and move it to `/data`
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

8. Rename ```env.example``` to ```env.local```, ```npm run build``` and check if your dApp is displayed correctly.
9. Create the PR if above steps succeeded.

And that's it! 🚀

Someone from the Alphland team will review the PR and contact you if they need to clarify anything.

## Maintainers
This repo is maintained by [Fugashu](https://github.com/Fugashu) and [msMatix](https://github.com/msMatix).

For any questions either create an issue on this repo or find us on the Alephium Discord:

<a href="https://discord.gg/3y8HvQ97s4">
  <img src="https://img.shields.io/badge/Discord-6666FF?style=for-the-badge&logo=discord&logoColor=white">
</a>

<!-- 

TODO 
## 📣 Share your dapp rating with the world

Embed the Alphland rating widget

<img src="https://dv3jj1unlp2jl.cloudfront.net/Alphland/widget-rating.svg" alt="Alphland rating widget" />

#### Using the widget

```
<a href="https://www.alph.land/{your_dapp_name}" style="display:inline-block;position:relative">
  <div style="position:absolute;top:0;right:0;bottom:0;left:0;"></div>
  <iframe src="https://www.alph.land/widgets/rating?dappname={your_dapp_name}" width="260" height="176" frameBorder="0" title="Alphland Widget"></iframe>
</a>
```

1. Copy and paste the snippet above
2. In `<a href="…">` change `your_dapp_name` to exactly the same as the name of your dapp as shown in your Alphland url.
3. Also change `your_dapp_name` in the `<iframe src="…">`
4. (Optional) you can also set the theme to `theme=light` or `theme=dark` 😎 (default uses the device settings).  
   Just add the `theme` param to the url after your dappname.
5. That's it!

#### Widget example

walph on Alphland would be `https://www.alph.land/walph`

```
<a href="https://www.alph.land/walph" style="display:inline-block;position:relative">
  <div style="position:absolute;top:0;right:0;bottom:0;left:0;"></div>
  <iframe src="https://www.alph.land/widgets/rating?dappname=walph" width="260" height="170" frameBorder="0" title="Alphland Widget"></iframe>
</a>
```
 -->
## Donations

Fuel our code with caffeine! If you'd like to sponsor a coffee for our project, you can donate to our ALPH wallet address below. Every sip powers our progress! 🚀☕
```
16uJvxtaSkuKEz3DEzCKHsemE4LWvnqZS1WrSAhoeL9Fr
```
## Acknowledgments

Special thanks to [Argentlabs](https://github.com/argentlabs/dappland). We're deeply grateful for their work, which laid the groundwork for this project.

We are immensely grateful to [Alephium](https://alephium.org/) and the [Blockflow Alliance DAO](https://twitter.com/Blockflow_DAO) for their generous support and sponsorship of this project.

For more information about our sponsors:
<div align="center">
<a href="https://alephium.org/">
<img src="src/assets/alephium-logos/grey/Logo-Icon-Grey.png" alt="Alephium" title="Alephium" style="width: 100px;">
</a>

<a href="https://twitter.com/Blockflow_DAO">
    <img src="src/assets/blockflow-alliance-dao.jpg" alt="Blockflow Alliance DAO" title="Blockflow Alliance DAO" style="width: 100px;">
</a>
</div>

