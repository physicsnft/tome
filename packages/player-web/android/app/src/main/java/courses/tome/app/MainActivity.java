package courses.tome.app;

import android.content.Intent;
import android.net.Uri;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    /**
     * Capacitor's App plugin reports ACTION_VIEW intents to the web side as "appUrlOpen". A file shared to
     * Tome arrives as ACTION_SEND with the file in EXTRA_STREAM instead, so present it as a VIEW of that
     * file and let the one code path handle both. BridgeActivity also routes the launch intent through here.
     */
    @Override
    protected void onNewIntent(Intent intent) {
        if (intent != null && Intent.ACTION_SEND.equals(intent.getAction())) {
            Uri stream = intent.getParcelableExtra(Intent.EXTRA_STREAM);
            if (stream != null) {
                intent.setAction(Intent.ACTION_VIEW);
                intent.setDataAndType(stream, intent.getType());
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            }
        }
        super.onNewIntent(intent);
    }
}
