import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting daily milk summary job");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Get all active suppliers
    const { data: suppliers, error: suppliersError } = await supabase
      .from("suppliers")
      .select("id, full_name, phone")
      .eq("is_active", true);

    if (suppliersError) {
      console.error("Error fetching suppliers:", suppliersError);
      throw suppliersError;
    }

    console.log(`Found ${suppliers?.length || 0} active suppliers`);

    const results = [];

    // Process each supplier
    for (const supplier of suppliers || []) {
      try {
        // Get today's collections for this supplier
        const { data: collections, error: collectionsError } = await supabase
          .from("milk_collections")
          .select("quantity_liters, fat_percentage, total_amount")
          .eq("supplier_id", supplier.id)
          .eq("collection_date", today);

        if (collectionsError) {
          console.error(`Error fetching collections for supplier ${supplier.id}:`, collectionsError);
          continue;
        }

        if (!collections || collections.length === 0) {
          console.log(`No collections today for supplier ${supplier.full_name}`);
          continue;
        }

        // Calculate totals
        const totalQuantity = collections.reduce((sum, c) => sum + Number(c.quantity_liters), 0);
        const totalAmount = collections.reduce((sum, c) => sum + Number(c.total_amount), 0);
        const avgFat = collections.reduce((sum, c) => sum + Number(c.fat_percentage || 0), 0) / collections.length;

        // Format SMS message
        const message = `MilkFlow Daily Summary (${today})\n` +
          `Collections: ${collections.length}\n` +
          `Total Quantity: ${totalQuantity.toFixed(2)} L\n` +
          `Avg Fat: ${avgFat.toFixed(2)}%\n` +
          `Total Amount: ₹${totalAmount.toFixed(2)}\n` +
          `Thank you, ${supplier.full_name}!`;

        // Send SMS
        const formattedPhone = supplier.phone.startsWith("+") ? supplier.phone : `+91${supplier.phone}`;
        const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
        
        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
          {
            method: "POST",
            headers: {
              "Authorization": `Basic ${auth}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              To: formattedPhone,
              From: TWILIO_PHONE_NUMBER!,
              Body: message,
            }),
          }
        );

        const data = await response.json();

        if (response.ok) {
          console.log(`SMS sent successfully to ${supplier.full_name}`);
          results.push({ supplier: supplier.full_name, status: "sent", messageSid: data.sid });
        } else {
          console.error(`Failed to send SMS to ${supplier.full_name}:`, data);
          results.push({ supplier: supplier.full_name, status: "failed", error: data });
        }
      } catch (error: any) {
        console.error(`Error processing supplier ${supplier.full_name}:`, error);
        results.push({ supplier: supplier.full_name, status: "error", error: error.message });
      }
    }

    console.log("Daily milk summary job completed");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Daily summaries processed",
        results,
        total: suppliers?.length || 0,
        sent: results.filter(r => r.status === "sent").length
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in daily summary job:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
