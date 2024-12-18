// Editor.jsx
import { useState, useEffect, useCallback } from "react";
import styles from "./style.module.sass";

export default function Editor({ layer, children }) {
        return (
        <div className={`${styles.layer}`} style={{zIndex: layer.level}}>
            <div className={`${styles.wrap}`}>
                { children }
                { !layer.image && (<img className={styles.image} src={`../_blank.png`} width="1365" height="1024" />) }
                 { layer.image && (<img  className={styles.image} src={layer.image.src} width={layer.image.width} height={layer.image.height} />) }
            </div>
        </div>
    );
}