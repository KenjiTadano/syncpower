import * as React from "react";
import Box from "@mui/material/Box";

function TitleImage() {
  return (
    <Box>
      <img
        src="images/img_title.png" // 画像のパス
        alt="タイトル画像"
        style={{ width: "auto", height: "54px" }} // スタイリング
      />
    </Box>
  );
}

export default TitleImage;
