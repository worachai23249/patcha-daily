<?php
function sendOneSignalPush($title, $message) {
    $curl = curl_init();

    $appId = "39818e43-6833-4b71-8add-d96a5df08fb8";
    $restApiKey = "os_v2_app_hgay4q3ignfxdcw53fvf34epxdfgfbu5c4veez4zdaxnqvtsqnrfzo3wynkvqtsmoxwzabytqwkgpirzav5yteswolq7qpv7qmnckqi";

    $fields = array(
        'app_id' => $appId,
        'included_segments' => array('All'),
        'contents' => array("en" => $message, "th" => $message),
        'headings' => array("en" => $title, "th" => $title),
    );

    $fieldsStr = json_encode($fields);

    curl_setopt_array($curl, array(
        CURLOPT_URL => "https://onesignal.com/api/v1/notifications",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => "",
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST => "POST",
        CURLOPT_POSTFIELDS => $fieldsStr,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_HTTPHEADER => array(
            "Authorization: Basic " . $restApiKey,
            "Content-Type: application/json; charset=utf-8"
        ),
    ));

    $response = curl_exec($curl);
    curl_close($curl);
    
    return $response;
}
?>
